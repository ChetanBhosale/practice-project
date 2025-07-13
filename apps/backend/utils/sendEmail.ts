export const sendOtpEmail = async (email: string, otp: string) => {
  console.log(`Sending OTP ${otp} to email: ${email}`);
  // Implement real email service here using nodemailer, resend, etc.
};
