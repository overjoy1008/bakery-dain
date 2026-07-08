import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { fallbackMenuCatalog, loadMenuCatalog, type BakeryMenuItem } from "../lib/bakery-data";

const priceFormatter = new Intl.NumberFormat("ko-KR", {
  currency: "KRW",
  maximumFractionDigits: 0,
  style: "currency",
});

type MenuSurfaceProps = {
  mode?: "preview" | "full";
};

export function MenuSurface({ mode = "preview" }: MenuSurfaceProps) {
  const [menuCatalog, setMenuCatalog] = useState(fallbackMenuCatalog);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const menuCategories = menuCatalog.categories;
  const menuItems = menuCatalog.items;
  const visibleMenuItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === selectedCategory);

  useEffect(() => {
    let isMounted = true;

    loadMenuCatalog()
      .then((catalog) => {
        if (isMounted) {
          setMenuCatalog(catalog);
          setLoadFailed(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMenuCatalog(fallbackMenuCatalog);
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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

      {loadFailed && (
        <p className="surface-message">
          메뉴 정보를 원격에서 불러오지 못해 임시 메뉴를 보여드리고 있어요.
        </p>
      )}

      <div className="menu-grid" aria-busy={isLoading}>
        {visibleMenuItems.map((item: BakeryMenuItem) => (
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
