const User = require('../models/User');
const bcrypt = require('bcrypt');
const saltRounds = 10; // The number of salt rounds for hashing
const jwt = require('jsonwebtoken');
const fs = require('fs/promises');
const aws = require('aws-sdk');
const { Readable } = require('stream');

// AWS S3 Configuration
const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Authenticate a user
exports.verifyUserToken = async (req, res, next) => {
    try {
        let token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'Access Denied / Unauthorized request' });
        }
        token = token.split(' ')[1]
        if (token === 'null' || !token) {
            return res.status(401).json({ errpr: 'Access Denied / Unauthorized request' });
        }
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified) {
            return res.status(401).json({ error: 'Access Denied / Unauthorized request' });
        }
        req.user = verified;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Please authenticate' });
    }
}

// Create a new user
exports.createUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create a new user with the hashed password
        const user = new User({ email, password: hashedPassword });

        // Save the user to the database
        const savedUser = await user.save();

        res.status(201).json(savedUser);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all users
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching users' });
    }
};

// Get a single user by ID
exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Omit the user password from the response
        const { password, ...userWithoutPassword } = user.toObject();

        res.status(200).json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching user' });
    }
}


// Update a user by ID
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            req.body,
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Error updating user' });
    }
};

// Delete a user by ID
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const deletedUser = await User.findByIdAndDelete(userId);
        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(deletedUser);
    } catch (error) {
        res.status(500).json({ error: 'Error deleting user' });
    }
};

// Login a user
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate an access token
        const accessToken = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.status(200).header("auth-token", accessToken).send({ "token": accessToken, "user": user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.uploadProfileImage = async (req, res) => {
    try {
        const file = req.file;

        // Check if a file was uploaded
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileName = `profiles/${Date.now()}-${file.originalname}`; // Updated Key

        // Create a Readable stream from the buffer
        const fileStream = Readable.from(file.buffer);

        let uniqueId;

        s3.upload(
            {
                Bucket: 'forevertrendin-bucket',
                Key: fileName,
                Body: fileStream,
                ContentType: file.mimetype,
            },
            async (error, data) => {
                if (error) {
                    console.error(error);
                    return res.status(500).json({ error: 'Error uploading file to S3' });
                }

                uniqueId = data.Location;

                // Check if the user already has a profile image
                const userId = req.params.userId;
                const user = await User.findById(userId);

                if (user.profileImageId) {
                    // If an old profile image exists, delete it from S3
                    try {
                        const oldImageKey = user.profileImageId.split('/').pop(); // Extract the key from the URL
                        await s3.deleteObject({
                            Bucket: 'forevertrendin-bucket',
                            Key: `profiles/${oldImageKey}`,
                        }).promise();
                    } catch (deleteError) {
                        console.error('Error deleting old profile image from S3:', deleteError);
                        return res.status(500).json({ error: 'Error deleting old profile image from S3' });
                    }
                }

                // Update the user with the new profile image ID
                const updatedUser = await User.findByIdAndUpdate(
                    userId,
                    { $set: { profileImageId: uniqueId } },
                    { new: true }
                );

                if (!updatedUser) {
                    return res.status(404).json({ error: 'User not found' });
                }

                // Respond with a success message
                res.status(200).json({ message: 'File uploaded successfully', fileId: uniqueId });
            }
        );
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Error uploading file' });
    }
};