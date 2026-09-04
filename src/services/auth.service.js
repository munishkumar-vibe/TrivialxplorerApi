const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User.model");
const ApiError = require("../utils/ApiError");
const { sendPasswordResetEmail } = require("./email.service");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  maxAge: Number(process.env.COOKIE_MAX_AGE_DAYS || 7) * 24 * 60 * 60 * 1000,
};

const signAccessToken = (id, role = "user") =>
  jwt.sign(
    { id, role, jti: crypto.randomBytes(16).toString("hex") },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "2h" }
  );

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });

const issueTokens = async (user, res) => {
  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  const maxSessions = Number(process.env.MAX_SESSIONS_PER_USER || 5);
  await User.findByIdAndUpdate(user._id, {
    $push: {
      refreshTokens: {
        $each: [refreshToken],
        $slice: -maxSessions,
      },
    },
  });

  res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
  return { userAccessToken: accessToken };
};

const signup = async (body) => {
  const { username, firstName, lastName, email, phone, dob, password, terms } = body;

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const field = existing.email === email ? "email" : "username";
    throw new ApiError(409, `An account with this ${field} already exists.`);
  }

  const user = await User.create({ username, firstName, lastName, email, phone, dob, password, terms });
  return user;
};

const signin = async ({ email, password }, res) => {
  const user = await User.findOne({ email }).select("+password +refreshTokens");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const { userAccessToken } = await issueTokens(user, res);
  return { user, userAccessToken };
};

const refreshAccessToken = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new ApiError(401, "No refresh token provided.");

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token. Please sign in again.");
  }

  const user = await User.findById(decoded.id).select("+refreshTokens");
  if (!user || !user.refreshTokens.includes(token)) {
    // Token reuse detected — invalidate all sessions
    if (user) {
      await User.findByIdAndUpdate(decoded.id, { $set: { refreshTokens: [] } });
    }
    throw new ApiError(401, "Refresh token has been revoked. Please sign in again.");
  }

  // Rotate refresh token
  await User.findByIdAndUpdate(decoded.id, {
    $pull: { refreshTokens: token },
  });

  const { userAccessToken } = await issueTokens(user, res);
  return { user, userAccessToken };
};

const signout = async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      await User.findByIdAndUpdate(decoded.id, {
        $pull: { refreshTokens: token },
      });
    } catch {
      // Token already invalid — still clear the cookie
    }
  }

  res.clearCookie("refreshToken", { ...COOKIE_OPTIONS, maxAge: 0 });
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  // Return silently even if no user — prevents email enumeration
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  const expiresMinutes = Number(process.env.PASSWORD_RESET_EXPIRES_MINUTES || 10);
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + expiresMinutes * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  try {
    await sendPasswordResetEmail({
      email: user.email,
      firstName: user.firstName,
      resetURL,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "Failed to send password reset email. Please try again later.");
  }
};

const resetPassword = async ({ token, password }) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+refreshTokens");

  if (!user) throw new ApiError(400, "Password reset token is invalid or has expired.");

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = []; // Invalidate all existing sessions
  await user.save();
};

const verifySession = async (req) => {
  const token = req.cookies?.refreshToken;
  if (!token) return false;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    return false;
  }

  const user = await User.findById(decoded.id).select("+refreshTokens");
  if (!user || !user.refreshTokens.includes(token)) return false;

  return true;
};

module.exports = { signup, signin, refreshAccessToken, signout, forgotPassword, resetPassword, verifySession };
