const authService = require("../services/auth.service");
const sendResponse = require("../utils/ApiResponse");

const signup = async (req, res, next) => {
  try {
    const user = await authService.signup(req.body);
    sendResponse(res, 201, "Account created successfully. Please sign in.", {
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
};

const signin = async (req, res, next) => {
  try {
    const { user, userAccessToken } = await authService.signin(req.body, res);
    sendResponse(res, 200, "Signed in successfully.", {
      userAccessToken,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { user, userAccessToken } = await authService.refreshAccessToken(req, res);
    sendResponse(res, 200, "Token refreshed successfully.", {
      userAccessToken,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
};

const signout = async (req, res, next) => {
  try {
    await authService.signout(req, res);
    sendResponse(res, 200, "Signed out successfully.", null);
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    // Always return the same message to prevent email enumeration
    sendResponse(
      res,
      200,
      "If an account with that email exists, a password reset link has been sent.",
      null
    );
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: "Reset token is required.", data: null });
    }
    await authService.resetPassword({ token, password: req.body.password });
    sendResponse(res, 200, "Password has been reset successfully. Please sign in with your new password.", null);
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    sendResponse(res, 200, "User fetched successfully.", {
      user: req.user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
};

const verifySession = async (req, res, next) => {
  try {
    const valid = await authService.verifySession(req);
    if (!valid) return res.status(401).json({ success: false, message: "Invalid session." });
    res.status(200).json({ success: true, message: "Session valid." });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, signin, refreshToken, signout, forgotPassword, resetPassword, getMe, verifySession };
