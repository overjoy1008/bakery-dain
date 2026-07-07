import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { menuCategories, menuItems } from "../data/brandShell";

const priceFormatter = new Intl.NumberFormat("ko-KR", {
  currency: "KRW",
  maximumFractionDigits: 0,
  style: "currency",
});

type MenuSurfaceProps = {
  mode?: "preview" | "full";
};

export function MenuSurface({ mode = "preview" }: MenuSurfaceProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const visibleMenuItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  return (
    <div className={`menu-surface menu-surface-${mode}`}>
      <div className="menu-toolbar" aria-label="메뉴 카테고리">
        {menuCategories.map((category) => (
          <button
            aria-pressed={selectedCategory === category.id}
            className="category-chip"
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            type="button"
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="menu-grid">
        {visibleMenuItems.map((item) => (
          <article className="menu-card" key={item.id}>
            <div className="menu-image-wrap">
              <img className="menu-image" src={item.image} alt={item.imageAlt} />
              <span className="menu-badge">{item.badge}</span>
            </div>

            <div className="menu-card-body">
              <div className="menu-card-topline">
                <span>{item.categoryLabel}</span>
                <strong>{priceFormatter.format(item.price)}</strong>
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <div className="menu-meta">
                <span>{item.status}</span>
                <span>{item.pickupLabel}</span>
              </div>
              <Link className="menu-action" to={`/reserve?menu=${item.id}`}>
                <Sparkles size={16} strokeWidth={1.9} />
                예약에 담기
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
