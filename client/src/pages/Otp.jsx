import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


const Otp = () => {
  const [otp, setOtp] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/verify-otp`, {
        email,
        otp
      });
      navigate('/login', { state: { message: 'Email verified successfully. Please login.' } });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: err.response?.data?.msg || 'An error occurred during verification',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/resend-otp`, { email });
      toast({
        title: "Success",
        description: res.data.msg || 'A new code has been sent to your email.',
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
          <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">Verify your email</CardTitle>
          <CardDescription className="text-gray-500 text-sm">
            We've sent a 6-digit code to <span className="font-medium text-gray-900">{email}</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-6 md:px-8">
            <div className="space-y-3">
              <Label htmlFor="otp" className="text-gray-700 text-sm font-medium sr-only">Enter OTP Code</Label>
              <Input 
                id="otp"
                type="text" 
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg transition-all text-center text-3xl font-semibold tracking-[0.5em] py-8"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-5 px-8 pb-8">
            <Button 
              type="submit" 
              disabled={loading || otp.length !== 6}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg shadow-sm transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </Button>
            <div className="text-center text-sm text-gray-500">
              Didn't receive the code? {' '}
              <button 
                type="button" 
                onClick={handleResend}
                disabled={resendLoading}
                className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline underline-offset-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' : 'Click to resend'}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Otp;
