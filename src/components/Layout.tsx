import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface LayoutProps {
  breadcrumb: { label: string; active?: boolean }[];
  children: React.ReactNode;
  toolbar?: React.ReactNode;
}

export default function Layout({ breadcrumb, children, toolbar }: LayoutProps) {
  return (
    <>
      <Topbar breadcrumb={breadcrumb} />
      <div className="app-body">
        <Sidebar />
        <div className="main">
          {toolbar}
          <div className="content">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
