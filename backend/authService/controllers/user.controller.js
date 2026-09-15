const User = require("../models/user.model").User;
const bcrypt = require("bcrypt");
const jwt = require('../util/jwtAuth')
var crypto = require("crypto");
const cookieParser = require('cookie-parser');

const nodemailer = require("nodemailer");


const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

const userRegistration = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Check password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists"
      });
    }

    const hash = bcrypt.hashSync(password, salt);
    const newUser = new User({
      name,
      email,
      password: hash,
    });

    const savedUser = await newUser.save();

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: "An error occurred during registration"
    });
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    const verified = bcrypt.compareSync(password, user.password);
    if (!verified) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    const token = jwt.jwtTokenGenerator(user);
    
    // Remove sensitive data before sending
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role // Include the user's role
    };

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: userData
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false,
      message: "An error occurred during login" 
    });
  }
};

const checkUserLoginStatus = async (req, res) => {
  try {
    const bearerToken = req.headers.authorization?.split(' ')[1];
    const token = req.cookies.token || bearerToken;
    const verify = jwt.jwtTokenVerify(token);
    
    if (!verify) {
      return res.status(401).json({
        success: false,
        message: "Not verified"
      });
    }

    const user = await User.findOne({ email: verify.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({ 
      success: true,
      message: "Verified",
      user: userData
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({
      success: false,
      message: "Something went wrong"
    });
  }
}

const forgetPassword = async (req, res) => {
  try {
    const { email, password, code } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const user = await User.findOne({ email });

    if (!password && !code) {
      if (!user) {
        return res.json({
          success: true,
          message: "Password reset instructions sent"
        });
      }

      const resetCode = String(Math.floor(100000 + Math.random() * 900000));
      const resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

      user.resetPasswordCode = resetCode;
      user.resetPasswordExpires = resetPasswordExpires;
      await user.save();

      if (process.env.NODE_ENV !== 'production') {
        console.log(`Password reset code for ${email}: ${resetCode}`);
      }

      return res.json({
        success: true,
        message: "Verification code sent",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Verification code is required"
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const expired = !user.resetPasswordExpires || user.resetPasswordExpires.getTime() < Date.now();
    if (expired || user.resetPasswordCode !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code"
      });
    }

    user.password = bcrypt.hashSync(password, salt);
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (err) {
    console.error('Password reset error:', err);
    res.status(500).json({ 
      success: false,
      message: "Something went wrong" 
    });
  }
};

const verificationEmailTrigger = async (req,res) => {
  //TODO: this needs to be modified based on the type of email carrier we choose
  try{
    const verificationToken = crypto.randomBytes(20).toString('hex');
    let user = await User.findOneAndUpdate({
      email: req.body.email
    },
    {
      verificationToken: verificationToken,
      verificationTokenStatus: true
    })
    verificationEmail(verificationToken, req.body.email)
    res.send({msg: "Verification Email Sent"})
  }catch(err){
    res.status(500).send({ msg: "Something went wrong" });
  }
}

const verificationEmail = async (verificationToken, email) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.forwardemail.net",
      port: 465,
      secure: true,
      auth: {
        user: "prashantdey@mailsire.com",
        pass: "Prashant123",
      }
    });

    const info = await transporter.sendMail({
      from: '"Streaming App" <noreply@streamingapp.com>',
      to: email,
      subject: "Verify your email",
      text: `${process.env.HOST}/val/${verificationToken}/${email}`,
      html: `<p>Click to verify: <a href="${process.env.HOST}/val/${verificationToken}/${email}">Verify Email</a></p>`,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (err) {
    console.error('Verification email error:', err);
  }
};

const verificationEmailAfterUserClick = async (req, res) => {
  try {
    const verificationTokenFromUrl = req.params['vid'];
    const email = req.params['email'];

    const user = await User.findOne({
      email,
      verificationToken: verificationTokenFromUrl,
      verificationTokenStatus: true
    });

    if (!user) {
      return res.send({ msg: "Wrong Token" });
    }

    console.log('Successfully Validated');
    res.send({ msg: "Email verified" });
  } catch (err) {
    res.status(500).send({ msg: "Something went wrong" });
  }
}

const newPasswordAdd = async (req,res) => {

}

module.exports = { userRegistration, userLogin, forgetPassword, checkUserLoginStatus, verificationEmailTrigger, verificationEmail,verificationEmailAfterUserClick, newPasswordAdd };
