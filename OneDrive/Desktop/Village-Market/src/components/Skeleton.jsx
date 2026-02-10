import React from 'react';

// Add shimmer animation to global styles if not already present
if (!document.getElementById('skeleton-styles')) {
    const style = document.createElement('style');
    style.id = 'skeleton-styles';
    style.textContent = `
        @keyframes shimmer {
            0% {
                background-position: -1000px 0;
            }
            100% {
                background-position: 1000px 0;
            }
        }
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
        }
    `;
    document.head.appendChild(style);
}

const Skeleton = ({ width, height, borderRadius, style, variant = 'shimmer' }) => {
    const baseStyle = {
        width: width || '100%',
        height: height || '20px',
        backgroundColor: '#e0e0e0',
        borderRadius: borderRadius || '4px',
        background: 'linear-gradient(to right, #eeeeee 8%, #dddddd 18%, #eeeeee 33%)',
        backgroundSize: '1000px 100%',
        animation: variant === 'pulse' ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'shimmer 1.5s infinite linear',
        ...style
    };

    return <div style={baseStyle} />;
};

/**
 * Skeleton for card layouts
 */
export const SkeletonCard = () => (
    <div className="card" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Skeleton width="80px" height="80px" borderRadius="8px" />
        <div style={{ flex: 1 }}>
            <Skeleton width="60%" height="20px" style={{ marginBottom: '10px' }} />
            <Skeleton width="40%" height="15px" style={{ marginBottom: '10px' }} />
            <Skeleton width="30%" height="15px" />
        </div>
    </div>
);

/**
 * Skeleton for shop detail page
 */
export const SkeletonShopDetail = () => (
    <div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '1.5rem', height: '180px' }}>
            <Skeleton borderRadius="16px" />
            <Skeleton borderRadius="16px" />
        </div>
        
        <div className="card">
            <Skeleton width="50%" height="24px" style={{ marginBottom: '12px' }} />
            <Skeleton width="70%" height="16px" style={{ marginBottom: '20px' }} />
            <Skeleton width="100%" height="60px" style={{ marginBottom: '12px' }} />
        </div>

        <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Products</h3>
        {[1, 2, 3].map(i => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

/**
 * Skeleton for product list
 */
export const SkeletonProductList = ({ count = 5 }) => (
    <div>
        {Array(count).fill(0).map((_, i) => (
            <SkeletonCard key={i} />
        ))}
    </div>
);

/**
 * Loading indicator component
 */
export const LoadingIndicator = ({ fullScreen = false, message = 'Loading...' }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        padding: fullScreen ? 0 : '40px 20px',
        minHeight: fullScreen ? '100vh' : '200px'
    }}>
        <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #2563EB',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: '#666', margin: 0 }}>{message}</p>
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

/**
 * Empty state indicator
 */
export const EmptyState = ({ 
    icon = '📦', 
    title = 'No items found',
    description = 'Try adjusting your search or filters'
}) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '40px 20px',
        color: '#666',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '3rem' }}>{icon}</div>
        <h3 style={{ margin: '10px 0 5px 0', color: '#333' }}>{title}</h3>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>{description}</p>
    </div>
);

export default Skeleton;
