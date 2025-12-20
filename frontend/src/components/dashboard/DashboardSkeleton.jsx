import React from 'react';

const SkeletonCard = ({ className }) => (
    <div className={`bg-white rounded-xl p-6 border border-gray-100 shadow-sm animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-100 rounded w-1/4"></div>
    </div>
);

const SkeletonChart = ({ className, height = "h-96" }) => (
    <div className={`bg-white rounded-xl p-6 border border-gray-100 shadow-sm animate-pulse ${className} ${height}`}>
        <div className="flex justify-between mb-6">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-6 bg-gray-100 rounded w-1/6"></div>
        </div>
        <div className="h-full bg-gray-50 rounded-lg"></div>
    </div>
);

const DashboardSkeleton = () => {
    return (
        <div className="p-6 space-y-8 bg-gray-50/50 min-h-screen">
            {/* Header Skeleton */}
            <div className="flex justify-between items-end mb-8 animate-pulse">
                <div>
                    <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                    <div className="h-4 bg-gray-100 rounded w-64"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>

            {/* Charts Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-8">
                <SkeletonChart className="col-span-1 lg:col-span-2" />
                <SkeletonChart className="col-span-1" />
                <SkeletonChart className="col-span-1" />
                <SkeletonChart className="col-span-1 lg:col-span-4" height="h-[28rem]" />
            </div>
        </div>
    );
};

export default DashboardSkeleton;
