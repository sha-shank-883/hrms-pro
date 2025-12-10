import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaRocket, FaCheckCircle, FaArrowRight } from 'react-icons/fa';

const WelcomeHero = ({ stats }) => {
    const { user } = useAuth();
    const completionPercentage = stats.total > 0
        ? Math.round((stats.completedTasks / stats.total) * 100)
        : 0;

    return (
        <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            borderRadius: '1rem',
            padding: '2.5rem',
            color: 'white',
            marginBottom: '2rem',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
        }}>
            {/* Decorative circles */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-5%',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-20%',
                left: '10%',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)',
                zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', md: { flexDirection: 'row' }, gap: '2rem', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.2)',
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        backdropFilter: 'blur(4px)'
                    }}>
                        <FaRocket />
                        <span>Let's get you started</span>
                    </div>

                    <h1 style={{
                        fontSize: '2.5rem',
                        fontWeight: '800',
                        marginBottom: '1rem',
                        lineHeight: 1.2
                    }}>
                        Welcome to the team,<br />
                        <span style={{ color: '#fbbf24' }}>{user.first_name || 'Team Member'}!</span>
                    </h1>

                    <p style={{
                        fontSize: '1.125rem',
                        opacity: 0.9,
                        maxWidth: '500px',
                        marginBottom: '2rem',
                        lineHeight: 1.6
                    }}>
                        We're thrilled to have you here. We've prepared a personalized checklist to help you settle in smoothly.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.pendingTasks}</div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Tasks Remaining</div>
                        </div>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.15)',
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.completedTasks}</div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Tasks Completed</div>
                        </div>
                    </div>
                </div>

                {/* Progress Circle */}
                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '1.5rem',
                    color: '#111827',
                    minWidth: '280px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontWeight: 'bold', fontSize: '1.125rem' }}>Your Progress</h3>
                        <span style={{
                            background: completionPercentage === 100 ? '#d1fae5' : '#e0e7ff',
                            color: completionPercentage === 100 ? '#059669' : '#4f46e5',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '1rem',
                            fontSize: '0.75rem',
                            fontWeight: 'bold'
                        }}>
                            {completionPercentage}%
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                        height: '0.75rem',
                        background: '#f3f4f6',
                        borderRadius: '1rem',
                        overflow: 'hidden',
                        marginBottom: '1.5rem'
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${completionPercentage}%`,
                            background: 'linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)',
                            borderRadius: '1rem',
                            transition: 'width 1s ease-in-out'
                        }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: completionPercentage > 0 ? 1 : 0.5 }}>
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: completionPercentage > 0 ? '#d1fae5' : '#f3f4f6',
                                color: completionPercentage > 0 ? '#059669' : '#9ca3af',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.75rem'
                            }}>
                                <FaCheckCircle />
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Account Created</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: completionPercentage >= 50 ? 1 : 0.5 }}>
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: completionPercentage >= 50 ? '#d1fae5' : '#f3f4f6',
                                color: completionPercentage >= 50 ? '#059669' : '#9ca3af',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.75rem'
                            }}>
                                <FaCheckCircle />
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>Profile Setup</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: completionPercentage === 100 ? 1 : 0.5 }}>
                            <div style={{
                                width: '24px', height: '24px', borderRadius: '50%',
                                background: completionPercentage === 100 ? '#d1fae5' : '#f3f4f6',
                                color: completionPercentage === 100 ? '#059669' : '#9ca3af',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.75rem'
                            }}>
                                <FaCheckCircle />
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>All Tasks Done</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeHero;
