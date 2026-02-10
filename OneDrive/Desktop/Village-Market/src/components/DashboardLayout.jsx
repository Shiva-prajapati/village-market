import React from 'react';
import './DashboardLayout.css';

const DashboardLayout = ({ sidebar, children }) => {
    return (
        <div className="dashboard-layout">
            <aside className="dashboard-sidebar">
                {sidebar}
            </aside>
            <main className="dashboard-main">
                <div className="dashboard-content-wrapper">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
