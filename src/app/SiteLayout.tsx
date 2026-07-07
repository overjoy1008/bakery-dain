import { Outlet, Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import { GiPretzel } from "react-icons/gi";
import { noticeItems } from "../data/brandShell";
import { useAuthUser } from "../lib/auth";

export function SiteLayout() {
  const currentUser = useAuthUser();

  return (
    <main className="brand-shell">
      <header className="site-header" aria-label="주요 메뉴">
        <Link className="brand-mark" to="/" aria-label="다닷네 베이커리 홈">
          <span className="brand-symbol">
            <GiPretzel aria-hidden="true" />
          </span>
          <span>다닷네 베이커리</span>
        </Link>

        <nav className="site-nav" aria-label="사이트 탐색">
          <Link to="/reserve">예약하기</Link>
          <Link to="/menu">메뉴</Link>
          <Link to="/reserve#pickup">픽업 안내</Link>
          <Link to="/#about">소개</Link>
        </nav>

        <Link className="account-link" to={currentUser ? "/reserve" : "/login"} aria-label="로그인 또는 마이페이지">
          <UserRound size={17} strokeWidth={1.9} />
          <span>{currentUser ? "마이페이지" : "로그인"}</span>
        </Link>
      </header>

      <section className="notice-rail" aria-label="예약 안내">
        <div className="notice-track">
          {[...noticeItems, ...noticeItems].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </section>

      <Outlet />
    </main>
  );
}
