import { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, UserPlus } from "lucide-react";
import { createUser, isUsernameTaken } from "../lib/auth";
import { SiteFooter } from "../sections/SiteFooter";

type DuplicateStatus = "idle" | "available" | "taken";

export function SignupPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [duplicateStatus, setDuplicateStatus] = useState<DuplicateStatus>("idle");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMatch = password.length > 0 && password === passwordConfirm;
  const hasRequiredFields = useMemo(
    () =>
      [username, password, passwordConfirm, name, phone, email, address].every(
        (value) => value.trim().length > 0,
      ),
    [address, email, name, password, passwordConfirm, phone, username],
  );
  const canSubmit = hasRequiredFields && duplicateStatus === "available" && passwordsMatch;

  const handleDuplicateCheck = async () => {
    if (!username.trim()) {
      setDuplicateStatus("idle");
      return;
    }

    setIsChecking(true);
    setErrorMessage("");

    try {
      setDuplicateStatus((await isUsernameTaken(username)) ? "taken" : "available");
    } catch {
      setErrorMessage("아이디 확인을 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await createUser({
        address: address.trim(),
        email: email.trim(),
        name: name.trim(),
        password,
        phone: phone.trim(),
        username: username.trim(),
      });
      navigate(response.redirectTo ?? "/mypage");
    } catch {
      setDuplicateStatus("taken");
      setErrorMessage("회원가입을 완료하지 못했어요. 입력 정보를 다시 확인해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="auth-page">
        <div className="auth-card">
          <p className="eyebrow">join bakery dain</p>
          <h1>회원가입</h1>
          <p>예약에 필요한 기본 정보를 저장해두고 다음 주문부터 빠르게 진행해요.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-field">
              <span>아이디</span>
              <div className="inline-field">
                <input
                  autoComplete="username"
                  onChange={(event) => {
                    setUsername(event.target.value);
                    setDuplicateStatus("idle");
                  }}
                  placeholder="아이디"
                  required
                  value={username}
                />
                <button disabled={isChecking} onClick={handleDuplicateCheck} type="button">
                  {isChecking ? "확인 중" : "중복확인"}
                </button>
              </div>
              {duplicateStatus === "available" && (
                <small className="form-success">
                  <Check size={14} strokeWidth={2} />
                  사용할 수 있는 아이디예요.
                </small>
              )}
              {duplicateStatus === "taken" && (
                <small className="form-error">이미 사용 중인 아이디예요.</small>
              )}
            </div>

            <div className="form-grid">
              <label className="form-field">
                <span>비밀번호</span>
                <input
                  autoComplete="new-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호"
                  required
                  type="password"
                  value={password}
                />
              </label>
              <label className="form-field">
                <span>비밀번호 확인</span>
                <input
                  autoComplete="new-password"
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="비밀번호 확인"
                  required
                  type="password"
                  value={passwordConfirm}
                />
              </label>
            </div>

            {passwordConfirm && !passwordsMatch && (
              <p className="form-error">비밀번호가 서로 달라요.</p>
            )}
            {errorMessage && <p className="form-error">{errorMessage}</p>}

            <div className="form-grid">
              <label className="form-field">
                <span>이름</span>
                <input
                  autoComplete="name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="예약자 이름"
                  required
                  value={name}
                />
              </label>
              <label className="form-field">
                <span>연락처</span>
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="010-0000-0000"
                  required
                  value={phone}
                />
              </label>
            </div>

            <label className="form-field">
              <span>이메일</span>
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="bakery@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="form-field">
              <span>주소</span>
              <input
                autoComplete="street-address"
                onChange={(event) => setAddress(event.target.value)}
                placeholder="예약 확인에 필요한 주소"
                required
                value={address}
              />
            </label>

            <button className="submit-reservation" disabled={!canSubmit || isSubmitting} type="submit">
              <UserPlus size={17} strokeWidth={1.9} />
              {isSubmitting ? "가입 중" : "가입하고 예약하기"}
            </button>
          </form>

          <p className="auth-helper">
            이미 계정이 있다면 <Link to="/login">로그인</Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
