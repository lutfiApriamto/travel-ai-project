import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils.js';
import Sidebar from './sidebar/Sidebar.jsx';
import AdminTopbar from './admin-topbar/AdminTopbar.jsx';

const AdminLayout = () => {
  const [isCollapsed,  setIsCollapsed]  = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page-shell">

      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/*
        Main content is offset on desktop by the sidebar width.
        Inline transition style ensures padding-left animates in sync
        with the Framer Motion sidebar width animation (same duration + easing).
      */}
      <div
        className={cn('flex flex-col min-h-screen bg-background', isCollapsed ? 'lg:pl-16' : 'lg:pl-60')}
        style={{ transition: 'padding-left 300ms cubic-bezier(0.4, 0, 0.2, 1)' }}
      >
        <AdminTopbar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(p => !p)}
          onToggleMobile={() => setIsMobileOpen(p => !p)}
        />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
