import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Instagram, ShoppingBag } from "lucide-react";
import { MenuSurface } from "../components/MenuSurface";
import { SiteFooter } from "./SiteFooter";

export function BrandShell() {
  const instagramUrl =
    "https://www.instagram.com/bakery_dain?igsh=MWxnb2FtcmJ5NGhyaQ==";

  return (
    <>
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
            <Link className="primary-action" to="/menu">
              이번 주 메뉴 보기
              <ArrowRight size={18} strokeWidth={1.9} />
            </Link>
            <Link className="secondary-action" to="/reserve">
              예약 주문하기
            </Link>
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
          <p>
            한 번에 많이 만들기보다 맛있게 드실 만큼만 준비해요. 메뉴를 고르고
            가능한 픽업일에 맞춰 예약해 주세요.
          </p>
        </div>

        <MenuSurface />
      </section>

      <section className="order-strip" id="reserve" aria-label="예약 흐름">
        <div>
          <ShoppingBag size={22} strokeWidth={1.8} />
          <span>메뉴 확인</span>
        </div>
        <div>
          <CalendarDays size={22} strokeWidth={1.8} />
          <span>예약 주문</span>
        </div>
        <a href={instagramUrl} rel="noreferrer" target="_blank">
          <Instagram size={22} strokeWidth={1.8} />
          <span>인스타: @bakery_dain</span>
        </a>
      </section>

      <SiteFooter />
    </>
  );
}
