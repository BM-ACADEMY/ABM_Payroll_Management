import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{7,}$/;
    if (!passwordRegex.test(password)) {
      toast({
        variant: "destructive",
        title: "Weak Password",
        description: "Password must contain at least 1 capital letter, 1 number, 1 symbol, and be more than 6 characters.",
      });
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        name,
        email,
        password
      });
      navigate('/otp', { state: { email } });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: err.response?.data?.msg || 'An error occurred during signup',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md bg-white border border-gray-100 shadow-xl rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        <CardHeader className="space-y-2 text-center pb-6 pt-6 px-4 md:px-8">
          <CardTitle className="text-2xl font-semibold tracking-tight text-gray-900">Create an account</CardTitle>
          <CardDescription className="text-gray-500 text-sm">
            Enter your details to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 px-6 md:px-8">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 text-sm font-medium">Full Name</Label>
              <Input 
                id="name"
                type="text" 
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 text-sm font-medium">Email address</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" id="password-label" className="text-gray-700 text-sm font-medium">Password</Label>
              <Input 
                id="password"
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg transition-all"
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-5 px-8 pb-8">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg shadow-sm transition-all duration-200 ease-in-out"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
            <div className="text-center text-sm text-gray-500">
              Already have an account? {' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline underline-offset-4 transition-colors">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Signup;
