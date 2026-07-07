import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { MenuSurface } from "../components/MenuSurface";
import { SiteFooter } from "../sections/SiteFooter";

export function MenuPage() {
  return (
    <>
      <section className="page-hero menu-page-hero">
        <p className="eyebrow">weekly menu</p>
        <h1>이번 주 예약 메뉴</h1>
        <p>
          선물하기 좋은 구움과자와 계절 디저트를 준비했어요. 원하는 메뉴를 담고
          가능한 픽업일에 맞춰 예약해 주세요.
        </p>
        <Link className="primary-action" to="/reserve">
          예약 주문하기
          <ArrowRight size={18} strokeWidth={1.9} />
        </Link>
      </section>

      <section className="page-section">
        <MenuSurface mode="full" />
      </section>

      <SiteFooter />
    </>
  );
}
