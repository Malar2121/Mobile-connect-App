const User = require('../models/User');
const jwt = require('jsonwebtoken');

// ──────────────────────────────────────────────────────────
// Helper: generate access token (30 days)
// ──────────────────────────────────────────────────────────
const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

// ──────────────────────────────────────────────────────────
// Helper: generate refresh token (90 days)
// ──────────────────────────────────────────────────────────
const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '90d',
  });

// ──────────────────────────────────────────────────────────
// Helper: strip sensitive fields from user object
// ──────────────────────────────────────────────────────────
const sanitize = (user) => {
  const obj = user.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

// ══════════════════════════════════════════════════════════
// POST /api/auth/register
// ══════════════════════════════════════════════════════════
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'fullName, email and password are required',
      });
    }

    // Check for duplicate email
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    // Create user (password is auto-hashed by the pre-save hook)
    const user = await User.create({ fullName, email, password, role });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Persist refresh token
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: sanitize(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/auth/login
// ══════════════════════════════════════════════════════════
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Explicitly select password (it is select:false on the schema)
    const user = await User.findOne({ email }).select('+password +refreshToken');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastSeen = Date.now();
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: sanitize(user),
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/auth/refresh
// ══════════════════════════════════════════════════════════
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Refresh token is required' });
    }

    // Verify the refresh token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Refresh token mismatch' });
    }

    // Issue new tokens
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message: 'Tokens refreshed',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// POST /api/auth/logout
// ══════════════════════════════════════════════════════════
const logoutUser = async (req, res) => {
  try {
    // req.user is attached by the auth middleware
    const user = await User.findById(req.user._id).select('+refreshToken');
    if (user) {
      user.refreshToken = null;
      await user.save({ validateBeforeSave: false });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: {},
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// GET /api/auth/me  (bonus — get current user profile)
// ══════════════════════════════════════════════════════════
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('familyId', 'name');
    return res.status(200).json({
      success: true,
      message: 'User profile retrieved',
      data: { user: sanitize(user) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ══════════════════════════════════════════════════════════
// PATCH /api/auth/me
// ══════════════════════════════════════════════════════════
const updateMe = async (req, res) => {
  try {
    const { pushPreferences, pushToken } = req.body;
    const updateData = {};
    if (pushPreferences) updateData.pushPreferences = pushPreferences;
    if (pushToken !== undefined) updateData.pushToken = pushToken;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true }).populate('familyId', 'name');
    return res.status(200).json({
      success: true,
      message: 'User profile updated',
      data: { user: sanitize(user) },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerUser, loginUser, refreshToken, logoutUser, getMe, updateMe };
