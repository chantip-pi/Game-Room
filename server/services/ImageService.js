const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const path = require('path');
const fileType = require('file-type');

// Cloudinary is auto-configured from CLOUDINARY_URL env variable


const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png', 

];

const MAX_FILE_SIZE = 5 * 1024 * 1024; 

class ImageService {
  constructor() {
    // Track images by room and user for cleanup
    this.userProfileImages = new Map(); // username -> { publicId, url, roomCode }
    this.mapImages = new Map(); // roomCode -> { publicId, url, createdBy }
    this.tempMapImages = new Map(); // roomCode -> { publicId, url, expiresAt }
  }

  // Enhanced file validation function
  async validateFileContent(buffer, mimetype) {
    try {
      // Verify file type using magic numbers
      const typeInfo = await fileType.fromBuffer(buffer);
      
      if (!typeInfo) {
        throw new Error('Invalid file format');
      }
      
      // Check if detected MIME type matches allowed types
      if (!ALLOWED_MIME_TYPES.includes(typeInfo.mime)) {
        throw new Error(`File type ${typeInfo.mime} not allowed`);
      }
      
      // Check if declared MIME type matches detected type
      if (mimetype !== typeInfo.mime) {
        throw new Error('File MIME type mismatch');
      }
      
      return true;
    } catch (error) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  // Sanitize filename
  sanitizeFilename(filename) {
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9\-_]/g, '_');
    return `${sanitizedName}${ext}`;
  }

  // Helper: upload buffer to Cloudinary
  async uploadToCloudinary(buffer, originalname, folder = 'images', options = {}) {
    const nameWithoutExt = path.basename(originalname, path.extname(originalname));

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: nameWithoutExt,
          overwrite: options.overwrite || false,
          use_filename: true,
          unique_filename: options.unique_filename !== false,
          ...options
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      streamifier.createReadStream(buffer).pipe(stream);
    });
  }

  // Upload user profile image
  async uploadUserProfile(username, roomCode, buffer, originalname, mimetype) {
    try {
      await this.validateFileContent(buffer, mimetype);
      
      const sanitizedName = this.sanitizeFilename(originalname);
      const folder = `profiles/${roomCode}`;
      const result = await this.uploadToCloudinary(buffer, sanitizedName, folder, {
        overwrite: true,
        unique_filename: false
      });

      const profileData = {
        username,
        roomCode,
        publicId: result.public_id,
        url: result.secure_url,
        uploadedAt: new Date()
      };

      // Store profile reference
      this.userProfileImages.set(username, profileData);

      console.log(`Profile image uploaded for ${username} in room ${roomCode}`);
      return profileData;
    } catch (error) {
      console.error(`Failed to upload profile for ${username}:`, error);
      throw error;
    }
  }

  // Upload map image (temporary - cleaned up on room close)
  async uploadMapImage(roomCode, createdBy, buffer, originalname, mimetype) {
    try {
      await this.validateFileContent(buffer, mimetype);
      
      const sanitizedName = this.sanitizeFilename(originalname);
      const folder = `maps/${roomCode}`;
      const result = await this.uploadToCloudinary(buffer, sanitizedName, folder, {
        overwrite: true,
        unique_filename: false
      });

      const mapData = {
        roomCode,
        createdBy,
        publicId: result.public_id,
        url: result.secure_url,
        uploadedAt: new Date()
      };

      // Store map reference
      this.mapImages.set(roomCode, mapData);

      console.log(`Map image uploaded for room ${roomCode} by ${createdBy}`);
      return mapData;
    } catch (error) {
      console.error(`Failed to upload map for room ${roomCode}:`, error);
      throw error;
    }
  }

  // Get user profile image
  getUserProfile(username) {
    return this.userProfileImages.get(username);
  }

  // Get map image
  getMapImage(roomCode) {
    return this.mapImages.get(roomCode);
  }

  // Update user profile image
  async updateUserProfile(username, roomCode, buffer, originalname, mimetype) {
    // Delete old profile if exists
    const oldProfile = this.userProfileImages.get(username);
    if (oldProfile) {
      await this.deleteImage(oldProfile.publicId);
    }

    return this.uploadUserProfile(username, roomCode, buffer, originalname, mimetype);
  }

  // Delete image from Cloudinary
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      if (result.result === 'not found') {
        console.warn(`Image not found: ${publicId}`);
      } else {
        console.log(`Deleted image: ${publicId}`);
      }
      return result;
    } catch (error) {
      console.error(`Failed to delete image ${publicId}:`, error);
      throw error;
    }
  }

  // Delete user profile image
  async deleteUserProfile(username) {
    const profile = this.userProfileImages.get(username);
    if (profile) {
      await this.deleteImage(profile.publicId);
      this.userProfileImages.delete(username);
      console.log(`Deleted profile image for ${username}`);
    }
  }

  // Delete map image (called when room is closed)
  async deleteMapImage(roomCode) {
    const mapImage = this.mapImages.get(roomCode);
    if (mapImage) {
      await this.deleteImage(mapImage.publicId);
      this.mapImages.delete(roomCode);
      console.log(`Deleted map image for room ${roomCode}`);
    }
  }

  // Cleanup all images for a room
  async cleanupRoom(roomCode) {
    try {
      // Delete map image
      await this.deleteMapImage(roomCode);

      // Delete profile images for users in this room
      const profilesToDelete = [];
      for (const [username, profile] of this.userProfileImages) {
        if (profile.roomCode === roomCode) {
          profilesToDelete.push(username);
        }
      }

      for (const username of profilesToDelete) {
        await this.deleteUserProfile(username);
      }

      console.log(`Cleaned up all images for room ${roomCode}`);
    } catch (error) {
      console.error(`Error cleaning up room ${roomCode}:`, error);
    }
  }

  // Cleanup user images when they disconnect
  async cleanupUser(username) {
    try {
      await this.deleteUserProfile(username);
      console.log(`Cleaned up images for user ${username}`);
    } catch (error) {
      console.error(`Error cleaning up user ${username}:`, error);
    }
  }

  // Get all images for monitoring
  getAllImages() {
    return {
      profiles: Array.from(this.userProfileImages.values()),
      maps: Array.from(this.mapImages.values())
    };
  }

  // Validate image size
  validateImageSize(buffer) {
    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`Image size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }
    return true;
  }
}

module.exports = new ImageService();