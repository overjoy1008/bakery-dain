import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, UserRound } from "lucide-react";
import { login } from "../lib/auth";
import { SiteFooter } from "../sections/SiteFooter";

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await login(username, password);
      navigate(response.redirectTo ?? (response.user.userType === "admin" ? "/admin" : "/mypage"));
    } catch {
      setErrorMessage("아이디 또는 비밀번호를 다시 확인해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="auth-page">
        <div className="auth-split">
          <section className="auth-panel">
            <p className="eyebrow">member reservation</p>
            <h1>로그인</h1>
            <p>회원 정보로 예약자 정보를 자동으로 불러와 더 빠르게 예약해요.</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="form-field">
                <span>아이디</span>
                <input
                  autoComplete="username"
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="아이디"
                  required
                  value={username}
                />
              </label>

              <label className="form-field">
                <span>비밀번호</span>
                <input
                  autoComplete="current-password"
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="비밀번호"
                  required
                  type="password"
                  value={password}
                />
              </label>

              {errorMessage && <p className="form-error">{errorMessage}</p>}

              <button className="submit-reservation" disabled={isSubmitting} type="submit">
                <UserRound size={17} strokeWidth={1.9} />
                {isSubmitting ? "로그인 중" : "로그인"}
              </button>
            </form>

            <p className="auth-helper">
              처음 오셨다면 <Link to="/signup">회원가입</Link>
            </p>
          </section>

          <section className="auth-guest-panel">
            <p className="eyebrow">guest reservation</p>
            <h2>비회원으로 바로 예약</h2>
            <p>가입 없이 메뉴와 픽업일을 고르고, 예약자 정보를 직접 입력해요.</p>
            <Link className="primary-action" to="/reserve?type=guest">
              비회원 예약
              <ArrowRight size={18} strokeWidth={1.9} />
            </Link>
          </section>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
