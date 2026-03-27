import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


const ResetPassword = () => {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{7,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must contain at least 1 capital letter, 1 number, 1 symbol, and be more than 6 characters.",
      });
      setLoading(false);
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        email,
        otp,
        newPassword
      });
      navigate('/login', { state: { message: 'Password reset successful. You can now login.' } });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: err.response?.data?.msg || 'An error occurred during password reset',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      // Re-trigger the forgot-password endpoint to send a fresh OTP
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, { email });
      toast({
        title: "Success",
        description: res.data.msg || 'A new reset code has been sent to your email.',
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Resend Failed",
        description: err.response?.data?.msg || 'Failed to resend OTP. Please try again.',
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md bg-white border border-gray-100 shadow-xl rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        <CardHeader className="space-y-2 text-center pb-6 pt-6 px-4 md:px-8">
          <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">Reset Password</CardTitle>
          <CardDescription className="text-gray-500 text-sm">
            Enter the 6-digit code sent to <span className="font-medium text-gray-900">{email}</span> and your new password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-6 md:px-8">
            
            <div className="space-y-3">
              <Label htmlFor="otp" className="text-gray-700 text-sm font-medium">OTP Code</Label>
              <Input 
                id="otp"
                type="text" 
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg transition-all text-center text-3xl font-semibold tracking-[0.5em] py-6"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword" id="password-label" className="text-gray-700 text-sm font-medium">New Password</Label>
              <Input 
                id="newPassword"
                type="password" 
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg transition-all"
                required
              />
            </div>
            
          </CardContent>
          <CardFooter className="flex flex-col space-y-5 px-8 pb-8">
            <Button 
              type="submit" 
              disabled={loading || otp.length !== 6 || newPassword.length < 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg shadow-sm transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting password...' : 'Reset Password'}
            </Button>
            
            <div className="flex flex-col space-y-3 pt-2">
              <div className="text-center text-sm text-gray-500">
                Didn't receive the code? {' '}
                <button 
                  type="button" 
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendLoading ? 'Sending...' : 'Click to resend'}
                </button>
              </div>
              <div className="text-center text-sm text-gray-500">
                <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                  Cancel and back to sign in
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
