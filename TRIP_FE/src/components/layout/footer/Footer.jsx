import { Link } from 'react-router-dom';
import { ROUTES } from '../../../utils/consts/routes.js';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Brand */}
          <div>
            <img
              src="/brand-logo/logo-horizontal-light.svg"
              alt="Travia"
              className="h-8 mb-3 dark:hidden"
            />
            <img
              src="/brand-logo/logo-horizontal-dark.svg"
              alt="Travia"
              className="h-8 mb-3 hidden dark:block"
            />
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI Travel Agent yang membantu kamu menemukan paket perjalanan
              impian melalui percakapan natural.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-[--text-heading] mb-3">Jelajahi</h4>
            <ul className="space-y-2">
              {[
                { label: 'Semua Produk', to: ROUTES.PRODUCTS },
                { label: 'AI Agent',     to: ROUTES.AI       },
                { label: 'Pesanan Saya', to: ROUTES.ORDERS   },
                { label: 'Tiket Saya',   to: ROUTES.TICKETS  },
              ].map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-muted-foreground hover:text-travia-orange transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kebijakan Refund */}
          <div>
            <h4 className="text-sm font-semibold text-[--text-heading] mb-3">Informasi</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to={ROUTES.REFUND_POLICY}
                  className="text-sm text-muted-foreground hover:text-travia-orange transition-colors"
                >
                  Kebijakan Refund
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row
          items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Travia · AI Travel Agent
          </p>
          <p className="text-xs text-muted-foreground">
            Dibuat dengan ❤ untuk pengalaman perjalanan terbaik
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
