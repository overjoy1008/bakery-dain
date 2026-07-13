import { Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { GiPretzel } from "react-icons/gi";
import { fallbackNoticeItems, loadSiteNotices } from "../lib/bakery-data";
import { useAuthUser } from "../lib/auth";

const NOTICE_REPEAT_COUNT = 4;

export function SiteLayout() {
  const currentUser = useAuthUser();
  const [noticeItems, setNoticeItems] = useState(fallbackNoticeItems);
  const noticeLoopItems = Array.from({ length: NOTICE_REPEAT_COUNT * 2 }, () => noticeItems).flat();

  useEffect(() => {
    let isMounted = true;

    loadSiteNotices()
      .then((items) => {
        if (isMounted && items.length > 0) {
          setNoticeItems(items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setNoticeItems(fallbackNoticeItems);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

        <Link
          className="account-link"
          to={currentUser?.userType === "admin" ? "/admin" : currentUser ? "/mypage" : "/login"}
          aria-label="로그인 또는 마이페이지"
        >
          <UserRound size={17} strokeWidth={1.9} />
          <span>{currentUser?.userType === "admin" ? "관리자" : currentUser ? "마이페이지" : "로그인"}</span>
        </Link>
      </header>

      <section className="notice-rail" aria-label="예약 안내">
        <div className="notice-track">
          {noticeLoopItems.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </section>

      <Outlet />
    </main>
  );
}
