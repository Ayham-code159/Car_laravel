import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  Menu,
  MessageCircle,
  MapPin,
  Phone,
  ArrowRight,
} from "lucide-react";
import { Brand } from "./Brand";
import { ButtonLink } from "../ui/Primitives";
import { Overlay } from "../ui/Overlay";
import { site, whatsappUrl } from "../../lib/config/site";

const nav = [
  { to: "/", name: "Home" },
  { to: "/cars", name: "Explore Cars" },
  { to: "/#how-it-works", name: "How It Works" },
  { to: "/#contact", name: "Contact" },
];
export function PublicLayout() {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => {
    setMenu(false);
  }, [location]);
  useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    let tries = 0;
    const timer = window.setInterval(() => {
      const target = document.getElementById(location.hash.slice(1));
      if (target) {
        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
        window.clearInterval(timer);
      } else if (++tries > 40) window.clearInterval(timer);
    }, 50);
    return () => window.clearInterval(timer);
  }, [location.pathname, location.hash, location.key]);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header
        className={`site-header ${scrolled || location.pathname !== "/" ? "solid" : ""}`}
      >
        <div className="container nav-inner">
          <Brand />
          <nav aria-label="Main navigation" className="desktop-nav">
            {nav.map((item) =>
              item.to.includes("#") ? (
                <Link key={item.to} to={item.to}>
                  {item.name}
                </Link>
              ) : (
                <NavLink end={item.to === "/"} key={item.to} to={item.to}>
                  {item.name}
                </NavLink>
              ),
            )}
          </nav>
          <ButtonLink to="/cars" variant="outline" className="desktop-nav-cta">
            Explore fleet
            <ArrowUpRight size={16} />
          </ButtonLink>
          <Overlay
            open={menu}
            onOpenChange={setMenu}
            title="Your next journey"
            description="Find a drive that feels like you."
            drawer
            trigger={
              <button
                className="icon-button mobile-menu-trigger"
                aria-label="Open navigation"
              >
                <Menu />
              </button>
            }
          >
            <nav aria-label="Mobile navigation" className="mobile-nav">
              {nav.map((item, index) => (
                <Link key={item.to} to={item.to} onClick={() => setMenu(false)}>
                  <small>0{index + 1}</small>
                  {item.name}
                  <ArrowUpRight size={22} />
                </Link>
              ))}
            </nav>
            <ButtonLink to="/cars" onClick={() => setMenu(false)}>
              Explore the collection
              <ArrowRight size={18} />
            </ButtonLink>
          </Overlay>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <footer id="contact">
        <div className="container">
          <div className="footer-main">
            <div className="footer-brand">
              <Brand />
              <p>
                {site.tagline}
                <br />
                Explore the collection. Find your own way.
              </p>
              {site.isPreview && (
                <p className="preview-note">
                  Preview identity — business details to be supplied.
                </p>
              )}
            </div>
            <div>
              <h2>DISCOVER</h2>
              <Link to="/">Home</Link>
              <Link to="/cars">Explore cars</Link>
              <Link to="/#how-it-works">How it works</Link>
            </div>
            <div className="footer-contact">
              <h2>LET’S TALK</h2>
              {site.phone && (
                <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>
                  <Phone size={15} />
                  {site.phone}
                </a>
              )}
              {site.whatsapp && (
                <a href={whatsappUrl()} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} />
                  WhatsApp
                  <ArrowUpRight size={14} />
                </a>
              )}
              {site.address && (
                <p>
                  <MapPin size={16} />
                  {site.address}
                </p>
              )}
              {!site.phone && !site.whatsapp && (
                <>
                  <p>Have a journey in mind?</p>
                  <Link to="/cars">
                    Choose a car and send a request
                    <ArrowUpRight size={15} />
                  </Link>
                </>
              )}
              {site.socials.map((s) => (
                <a key={s.name} href={s.url} target="_blank" rel="noreferrer">
                  {s.name}
                  <ArrowUpRight size={14} />
                </a>
              ))}
            </div>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} {site.name}. All rights reserved.
            </span>
            <span>A better way to begin your journey.</span>
            <a href="#main">Back to top ↑</a>
          </div>
        </div>
      </footer>
      {site.whatsapp && (
        <a
          className="whatsapp-float"
          href={whatsappUrl()}
          aria-label="Contact us on WhatsApp"
          target="_blank"
          rel="noreferrer"
        >
          <MessageCircle size={23} />
        </a>
      )}
    </>
  );
}
