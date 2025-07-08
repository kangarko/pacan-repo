'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, User, Loader2, Mail, Key, AlertCircle, CheckCircle, UserCog, ArrowRight, Lock, UserPlus } from 'lucide-react';
import GradientBackground from '@repo/ui/components/GradientBackground';
import { sendClientErrorEmail } from '@repo/ui/lib/clientUtils';
import { fetchJsonPost, formatDate } from '@repo/ui/lib/utils';

export default function SuperAdminPage() {
    // Authentication state
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    // Role management state
    const [targetEmail, setTargetEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState('user');
    const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null);
    const [roleUpdateSuccess, setRoleUpdateSuccess] = useState<string | null>(null);
    const [isRoleUpdateLoading, setIsRoleUpdateLoading] = useState(false);
    const [userData, setUserData] = useState<any | null>(null);
    const [apiSecret, setApiSecret] = useState<string | null>(null);

    // Create user state
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserRegion, setNewUserRegion] = useState('HR'); // Default to Croatia
    const [newUserRole, setNewUserRole] = useState('user'); // Default to 'user'
    const [createUserError, setCreateUserError] = useState<string | null>(null);
    const [createUserSuccess, setCreateUserSuccess] = useState<string | null>(null);
    const [isCreateUserLoading, setIsCreateUserLoading] = useState(false);

    // Roles available for assignment
    const availableRoles = [
        { id: 'user', name: 'Regular User' },
        { id: 'admin', name: 'Admin' },
        { id: 'superadmin', name: 'Super Admin' }
    ];

    const creatableRoles = availableRoles.filter(role => role.id !== 'superadmin');

    // Handle login form submission
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        setIsAuthLoading(true);

        try {
            const result = await fetchJsonPost('/api/superadmin/login', { email, password });

            if (result.token) {
                setApiSecret(result.token);
                setIsAuthenticated(true);
            } else {
                setAuthError(result.error || 'Invalid credentials');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred during login.';
            setAuthError(errorMessage);
            sendClientErrorEmail('Error in superadmin login:', error);
        } finally {
            setIsAuthLoading(false);
        }
    };

    // Handle looking up a user
    const handleLookupUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetEmail) {
            setRoleUpdateError('Please enter an email address');
            return;
        }

        setRoleUpdateError(null);
        setRoleUpdateSuccess(null);
        setIsRoleUpdateLoading(true);
        setUserData(null);

        try {
            const result = await fetchJsonPost(`/api/superadmin/list-users`, {
                token: apiSecret,
                email: targetEmail
            });

            if (!result.user) {
                setRoleUpdateError('User not found');
                setIsRoleUpdateLoading(false);
                return;
            }

            // Set the found user data
            setUserData(result.user);

            // Set the current role if it exists
            if (result.user.metadata?.role) {
                setSelectedRole(result.user.metadata.role);
            } else {
                setSelectedRole('user'); // Default role
            }

            setIsRoleUpdateLoading(false);
        } catch (error) {
            setRoleUpdateError(error instanceof Error ? error.message : 'An error occurred looking up the user');
            sendClientErrorEmail('Error in superadmin user lookup:', error);
            setIsRoleUpdateLoading(false);
        }
    };

    // Handle updating a user's role
    const handleUpdateRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData || !targetEmail) {
            setRoleUpdateError('Please lookup a user first');
            return;
        }

        setRoleUpdateError(null);
        setRoleUpdateSuccess(null);
        setIsRoleUpdateLoading(true);

        try {
            await fetchJsonPost('/api/superadmin/update-role', {
                token: apiSecret,
                email: targetEmail,
                role: selectedRole
            });

            setRoleUpdateSuccess(`Role updated successfully to ${selectedRole} for ${targetEmail}`);

            // Update the local user data to reflect the new role
            setUserData({
                ...userData,
                metadata: {
                    ...userData.metadata,
                    role: selectedRole
                }
            });

            setIsRoleUpdateLoading(false);
        } catch (error) {
            setRoleUpdateError(error instanceof Error ? error.message : 'An error occurred updating the role');
            sendClientErrorEmail('Error in superadmin role update:', error);
            setIsRoleUpdateLoading(false);
        }
    };

    // Handle creating a new user
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateUserError(null);
        setCreateUserSuccess(null);
        setIsCreateUserLoading(true);

        try {
            await fetchJsonPost('/api/superadmin/create-user', {
                token: apiSecret,
                email: newUserEmail,
                password: newUserPassword,
                name: newUserName,
                region: newUserRegion,
                role: newUserRole,
            });

            setCreateUserSuccess(`User ${newUserEmail} created successfully with role ${newUserRole}.`);
            // Clear form
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserName('');
            setNewUserRegion('HR');
            setNewUserRole('user');


        } catch (error) {
            setCreateUserError(error instanceof Error ? error.message : 'An error occurred creating the user');
            sendClientErrorEmail('Error in superadmin user creation:', error);
        } finally {
            setIsCreateUserLoading(false);
        }
    };

    // If not authenticated, show login screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen relative bg-gradient-to-br from-indigo-900 to-black">
                <div className="container mx-auto px-4 py-24 relative z-10">
                    <div className="max-w-md mx-auto">
                        <div className="text-center mb-8">
                            <div className="bg-purple-600/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Shield className="w-8 h-8 text-purple-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-4">
                                Super Admin Access
                            </h1>
                            <p className="text-gray-300">
                                Restricted area for system administrators only
                            </p>
                        </div>

                        <div className="bg-purple-900/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                {authError && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 text-red-400" />
                                            <p className="text-red-400 text-sm">{authError}</p>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isAuthLoading}
                                    className="w-full bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isAuthLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Authenticating...
                                        </>
                                    ) : (
                                        'Access Super Admin'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main super admin interface after authentication
    return (
        <div className="min-h-screen relative bg-gradient-to-br from-gray-900 to-purple-900">
            <GradientBackground />

            <div className="max-w-[1440px] mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Super Admin Dashboard</h1>
                    <p className="text-gray-400">Manage user roles and system settings</p>
                </div>

                {/* Navigation */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <Link
                        href="/admin"
                        className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors"
                    >
                        <ArrowRight className="w-5 h-5 mr-2 inline-block" />
                        <span>Go to Admin Dashboard</span>
                    </Link>
                </div>

                {/* Content Area */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <UserCog className="w-6 h-6 mr-2 text-purple-400" />
                        User Role Management
                    </h2>

                    {/* User Lookup Form */}
                    <div className="mb-8">
                        <form onSubmit={handleLookupUser} className="max-w-md">
                            <div className="flex flex-wrap gap-4">
                                <div className="flex-1">
                                    <label htmlFor="targetEmail" className="block text-sm font-medium text-gray-300 mb-1">
                                        User Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            id="targetEmail"
                                            value={targetEmail}
                                            onChange={(e) => setTargetEmail(e.target.value)}
                                            placeholder="user@example.com"
                                            className="w-full pl-10 pr-4 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button
                                        type="submit"
                                        disabled={isRoleUpdateLoading}
                                        className="bg-[#6B498F] hover:bg-[#4b2c5e] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                    >
                                        {isRoleUpdateLoading ? (
                                            <>
                                                <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                                Searching...
                                            </>
                                        ) : (
                                            <>
                                                <User className="w-4 h-4 mr-2" />
                                                Lookup User
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Error Message */}
                    {roleUpdateError && (
                        <div className="bg-red-900/30 border-l-4 border-red-500 text-white p-4 mb-6 rounded-r-md">
                            <p>{roleUpdateError}</p>
                        </div>
                    )}

                    {/* Success Message */}
                    {roleUpdateSuccess && (
                        <div className="bg-green-900/30 border-l-4 border-green-500 text-white p-4 mb-6 rounded-r-md flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                            <p>{roleUpdateSuccess}</p>
                        </div>
                    )}

                    {/* User Details & Role Setting Form */}
                    {userData && (
                        <div className="bg-purple-900/20 rounded-lg p-6 mb-6">
                            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                                <User className="w-5 h-5 mr-2 text-purple-400" />
                                User Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-gray-400 text-sm">Email</p>
                                    <p className="text-white">{userData.email}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">User ID</p>
                                    <p className="text-white">{userData.id}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Created</p>
                                    <p className="text-white">{formatDate(userData.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Current Role</p>
                                    <p className="text-white">{userData.user_metadata?.role || 'No role assigned'}</p>
                                </div>
                            </div>

                            <form onSubmit={handleUpdateRole} className="bg-black/20 p-4 rounded-lg">
                                <div className="mb-4">
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">
                                        Assign Role
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <select
                                            id="role"
                                            value={selectedRole}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white"
                                        >
                                            {availableRoles.map(role => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isRoleUpdateLoading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isRoleUpdateLoading ? (
                                        <>
                                            <Loader2 className="animate-spin w-4 h-4 mr-2" />
                                            Updating...
                                        </>
                                    ) : (
                                        'Update User Role'
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Create User Form Section */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <UserPlus className="w-6 h-6 mr-2 text-green-400" />
                        Create New User
                    </h2>
                    <div className="bg-black/20 p-6 rounded-lg">
                        <form onSubmit={handleCreateUser} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="newUserName" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                                    <input
                                        type="text"
                                        id="newUserName"
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        className="w-full pl-4 pr-4 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newUserEmail" className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        id="newUserEmail"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        className="w-full pl-4 pr-4 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newUserPassword" className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                                    <input
                                        type="password"
                                        id="newUserPassword"
                                        value={newUserPassword}
                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                        className="w-full pl-4 pr-4 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white"
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newUserRegion" className="block text-sm font-medium text-gray-300 mb-1">Region</label>
                                    <input
                                        type="text"
                                        id="newUserRegion"
                                        value={newUserRegion}
                                        onChange={(e) => setNewUserRegion(e.target.value.toUpperCase())}
                                        className="w-full pl-4 pr-4 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white uppercase"
                                        maxLength={2}
                                        placeholder="e.g. DE, RS, HR"
                                        pattern="[A-Za-z]{2}"
                                        title="Two-letter country code (e.g. DE, RS, HR)"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="newUserRole" className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                                    <select
                                        id="newUserRole"
                                        value={newUserRole}
                                        onChange={(e) => setNewUserRole(e.target.value)}
                                        className="w-full pl-4 pr-4 py-2 bg-purple-900/30 border border-purple-500/20 rounded-lg text-white"
                                    >
                                        {creatableRoles.map(role => (
                                            <option key={role.id} value={role.id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {createUserError && (
                                <div className="bg-red-900/30 border-l-4 border-red-500 text-white p-4 rounded-r-md">
                                    <p>{createUserError}</p>
                                </div>
                            )}

                            {createUserSuccess && (
                                <div className="bg-green-900/30 border-l-4 border-green-500 text-white p-4 rounded-r-md flex items-center">
                                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                                    <p>{createUserSuccess}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isCreateUserLoading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isCreateUserLoading ? (
                                    <>
                                        <Loader2 className="animate-spin w-5 h-5 mr-2" />
                                        Creating User...
                                    </>
                                ) : (
                                    'Create User'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}