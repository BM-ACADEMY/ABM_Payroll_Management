import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem('token', 'mock-jwt-token');
    const mockUser = email.includes('admin') ? { role: 'admin', name: 'Admin' } : { role: 'employee', name: 'John Doe' };
    setUser(mockUser);
    navigate(mockUser.role === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md bg-slate-900/50 border-slate-800 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-white">Payroll Login</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-primary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" id="password-label" className="text-slate-200">Password</Label>
              <Input 
                id="password"
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-primary"
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 text-lg transition-all duration-300">
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Login;
