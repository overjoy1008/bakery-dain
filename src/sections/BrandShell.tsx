import { ArrowRight, CalendarDays, Gift, Instagram, ShoppingBag } from "lucide-react";
import { featuredBakes, noticeItems } from "../data/brandShell";

export function BrandShell() {
  return (
    <main className="brand-shell">
      <header className="site-header" aria-label="주요 메뉴">
        <a className="brand-mark" href="#top" aria-label="다닷네 베이커리 홈">
          <span className="brand-symbol">d</span>
          <span>다닷네 베이커리</span>
        </a>

        <nav className="site-nav" aria-label="사이트 탐색">
          <a href="#reserve">예약하기</a>
          <a href="#menu">메뉴</a>
          <a href="#pickup">픽업 안내</a>
          <a href="#about">소개</a>
        </nav>

        <a className="icon-link" href="#menu" aria-label="메뉴 보러가기">
          <ShoppingBag size={19} strokeWidth={1.9} />
        </a>
      </header>

      <section className="notice-rail" aria-label="예약 안내">
        <div className="notice-track">
          {[...noticeItems, ...noticeItems].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </section>

      <section className="hero-section" id="top">
        <img
          className="hero-image"
          src="/images/dadatne-hero-preview.png"
          alt="크림색 테이블 위에 놓인 타르트, 쿠키, 잼과 선물 상자"
        />
        <div className="hero-shade" />

        <div className="hero-content">
          <p className="eyebrow">small batch preorder bakery</p>
          <h1>소소하게 굽는 다닷네 베이커리</h1>
          <p className="hero-copy">
            예약한 만큼만 정성껏 굽고, 픽업 시간에 맞춰 따뜻하게 준비해요.
          </p>

          <div className="hero-actions">
            <a className="primary-action" href="#menu">
              이번 주 메뉴 보기
              <ArrowRight size={18} strokeWidth={1.9} />
            </a>
            <a className="secondary-action" href="#reserve">
              예약 가능일 확인
            </a>
          </div>
        </div>

        <aside className="pickup-note" aria-label="이번 주 운영 메모">
          <CalendarDays size={20} strokeWidth={1.8} />
          <span>이번 주 픽업 예약 준비 중</span>
        </aside>
      </section>

      <section className="brand-preview" id="menu" aria-label="이번 주 메뉴 미리보기">
        <div className="section-heading">
          <p className="eyebrow">this week's tiny menu</p>
          <h2>이번 주에 어울리는 작은 달콤함</h2>
        </div>

        <div className="bake-list">
          {featuredBakes.map((item) => (
            <article className="bake-card" key={item.name}>
              <span>{item.accent}</span>
              <h3>{item.name}</h3>
              <p>{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="order-strip" id="reserve" aria-label="예약 흐름">
        <div>
          <Gift size={22} strokeWidth={1.8} />
          <span>예약 제작</span>
        </div>
        <div>
          <CalendarDays size={22} strokeWidth={1.8} />
          <span>픽업 중심</span>
        </div>
        <div>
          <Instagram size={22} strokeWidth={1.8} />
          <span>인스타 연결 예정</span>
        </div>
      </section>

      <footer className="site-footer" id="pickup">
        <span>다닷네 베이커리</span>
        <span>소량 제작 · 예약 후 픽업 · 선물 포장 가능</span>
      </footer>
    </main>
  );
}
