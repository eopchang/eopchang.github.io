# NeuroAI Research Group 홈페이지

DGIST 이론신경과학 & 계산의학 연구실(김창업 교수) 홈페이지입니다.
Google Sites의 내용을 모두 옮겨 GitHub Pages(Jekyll)로 다시 만들었습니다.

- 페이지: Home · Research · Members · Publications · News · Photos · Blog · Contact
- 옮긴 내용: 논문 89편, 뉴스 31건, 사진 앨범 108개(580장), 블로그 글 41편, 구성원 14명
- 이미지는 전부 WebP로 변환해 저장소 안에 들어 있습니다 (외부 링크 의존 없음).

---

## 1. GitHub Pages로 올리기

1. GitHub에서 새 저장소를 만듭니다.
   - 주소를 `https://<아이디>.github.io` 로 쓰려면 저장소 이름을 **`<아이디>.github.io`** 로 합니다.
   - 다른 이름(예: `nnsm`)으로 만들면 주소는 `https://<아이디>.github.io/nnsm` 이 됩니다.
2. 이 폴더의 내용을 저장소에 올립니다.
   ```bash
   cd nnsm-site
   git init && git add . && git commit -m "Lab homepage"
   git branch -M main
   git remote add origin https://github.com/<아이디>/<저장소이름>.git
   git push -u origin main
   ```
3. 저장소 **Settings → Pages** 에서 Source를 **Deploy from a branch**, Branch를 **main / (root)** 로 지정합니다.
4. 1~2분 뒤 사이트가 열립니다. 이후로는 `main`에 push할 때마다 자동으로 다시 빌드됩니다.

### `_config.yml`에서 꼭 확인할 두 줄

```yaml
url: "https://<아이디>.github.io"   # 링크 미리보기(카톡·슬랙)에 쓰이는 사이트 주소
baseurl: ""                          # 저장소 이름이 <아이디>.github.io 가 아니면 "/저장소이름"
```

`baseurl`이 맞지 않으면 CSS와 이미지가 깨진 채로 보입니다.

### 개인 도메인 연결 (선택)

`lab.example.ac.kr` 같은 주소를 쓰려면 Settings → Pages → Custom domain에 도메인을 입력하고,
도메인 관리 쪽에서 CNAME 레코드를 `<아이디>.github.io` 로 지정합니다. 이 경우 `baseurl`은 `""` 입니다.

---

## 2. 내용 고치기

대부분의 내용은 `_data/` 폴더의 YAML 파일에 있습니다. GitHub 웹에서 파일을 열고 연필 아이콘으로 바로 고쳐도 됩니다.
YAML은 **들여쓰기(스페이스 2칸)** 가 중요합니다. 제목에 `:` 이 들어가면 작은따옴표로 감싸 주세요.

| 바꾸고 싶은 것 | 파일 |
|---|---|
| 연구실 이름, 소개 문구, 연락처, 홈 화면 인용문 | `_data/lab.yml` |
| 연구 주제 3개 | `_data/research.yml` |
| 구성원 | `_data/members.yml` |
| 논문 | `_data/publications.yml` |
| 뉴스 | `_data/news.yml` |
| 사진 앨범 | `_data/photos.yml` |
| 블로그 글 | `_posts/` |

### 논문 추가

`_data/publications.yml`에서 해당 연도 `items:` 맨 위에 추가합니다. 연도가 없으면 맨 위에 연도 블록을 새로 만듭니다.

```yaml
- year: 2026
  items:
  - title: 'Paper title: subtitle'
    url: https://doi.org/10.xxxx/xxxxx
    info: Journal Name. 2026 Oct. Author A, Author B, Chang-Eop Kim*.
    featured: true        # '주요 논문'과 홈 화면에 표시하려면 (선택)
```

책임교수 이름(Chang-Eop Kim, CE Kim, 김창업 등)은 자동으로 굵게 표시됩니다.

### 뉴스 추가

`_data/news.yml` 맨 위에 추가합니다. 이미지는 `assets/img/news/`에 넣습니다.

```yaml
- title: 뉴스 제목
  source: 한의신문            # 없으면 ''
  url: https://기사주소
  points:
  - 요약 한 줄
  - 요약 두 줄
  images:
  - /assets/img/news/새이미지.webp
```

### 구성원 추가·졸업 처리

`_data/members.yml`은 그룹(책임교수, 박사후연구원, 박사과정, 석사과정, 행정, 졸업생…)별로 나뉘어 있습니다.
사진은 `assets/img/members/`에 넣고(세로 4:5 비율 권장) 아래처럼 추가합니다.

```yaml
  - name_ko: 홍길동
    name_en: Gildong Hong
    degrees: MD(DKM)
    photo: /assets/img/members/gildong-hong.webp
    bio: 소개 문장...
    email: someone@dgist.ac.kr
    links:
    - label: Github
      url: https://github.com/...
```

졸업하면 해당 항목을 졸업생 그룹(`alumni-phd`, `alumni-ms`)으로 옮기고 현재 소속을 적어 줍니다.

```yaml
    position:
    - 원광대 한의대 교수
```

### 사진 앨범 추가

**방법 A — 스크립트 (권장).** 사진을 한 폴더에 모아 두고 저장소 맨 위에서 실행합니다. Python과 Pillow가 필요합니다.

```bash
pip install pillow
python3 tools/add_photos.py ~/Desktop/가을워크숍 --date "2026. 10. 17" --title "가을 워크숍" --title-en "Autumn Workshop"
```

사진을 WebP(원본 1600px + 썸네일)로 바꿔 `assets/img/photos/`에 넣고, `_data/photos.yml` 맨 위에 앨범을 추가해 줍니다.

**방법 B — 손으로.** `assets/img/photos/<폴더>/`에 JPG를 올리고 `_data/photos.yml` 맨 위에 아래처럼 적습니다.
썸네일이 없으면 원본을 그대로 씁니다(조금 느려질 뿐 잘 보입니다).

```yaml
- id: 2026-autumn
  year: 2026
  date: 2026. 10. 17
  title: 가을 워크숍
  title_en: Autumn Workshop
  photos:
  - /assets/img/photos/2026-autumn/01.jpg
  - /assets/img/photos/2026-autumn/02.jpg
```

### 블로그 글 쓰기

`_posts/` 폴더에 `YYYY-MM-DD-영문-슬러그.md` 파일을 만들고 Markdown으로 씁니다.

```markdown
---
title: 글 제목
date: 2026-10-18 09:00:00 +0900
cover: /assets/img/blog/my-post/cover.webp   # 목록 썸네일·링크 미리보기 이미지 (선택)
---

첫 문단은 목록에 요약으로 보입니다.

![그림 설명](/assets/img/blog/my-post/figure1.webp)

**굵게**, [링크](https://...), 목록, 인용 등 일반 Markdown을 그대로 쓸 수 있습니다.
```

주소는 `/blog/2026/영문-슬러그/` 가 됩니다. 기존 글(`.html`)도 그대로 편집할 수 있습니다.

> `baseurl`을 쓰는 저장소(예: `/nnsm`)라면 Markdown 본문의 이미지 경로 앞에도 `/nnsm` 을 붙여 주세요.

---

## 3. 내 컴퓨터에서 미리 보기 (선택)

Ruby가 설치되어 있으면:

```bash
bundle install
bundle exec jekyll serve
```

브라우저에서 `http://localhost:4000` 을 엽니다. 저장할 때마다 자동으로 다시 만들어집니다.

---

## 4. 디자인 메모

- **홈 화면 블랙홀**은 이미지가 아니라 브라우저에서 실시간으로 계산되는 화면입니다 (`assets/js/gargantua.js`).
  슈바르츠실트 블랙홀 주변에서 빛이 휘는 경로를 직접 따라가며 그리기 때문에, 강착원반이 그림자 위아래로 휘어 보입니다.
  마우스를 움직이면 시점이 조금씩 따라 움직입니다.
- 그래픽 성능이 부족한 기기, WebGL이 꺼진 브라우저, '동작 줄이기' 설정을 켠 경우에는 같은 장면의 정지 이미지
  (`assets/img/gargantua-poster*.jpg`)가 대신 보입니다.
- 색과 글꼴은 `assets/css/main.css` 맨 위의 변수에서 한 번에 바꿀 수 있습니다.
  - 배경 `#000`, 본문 `#e6e9ef`, 보조 `#8d96a6`, 강착원반 금색 `#e7b573`
  - 글꼴: Cormorant Garamond(영문 제목), Noto Serif KR(한글 제목), Pretendard(본문)
- 흰 배경 연구 그림은 검은 화면에 어울리도록 반전되어 보입니다. 이미지에 `class="on-dark"` 가 붙은 경우입니다.

## 폴더 구조

```
_config.yml          사이트 설정 (baseurl, url)
_data/               내용 (YAML)
_posts/              블로그 글
_layouts/, _includes/ 페이지 틀
assets/css, assets/js 디자인과 동작
assets/img/          모든 이미지 (WebP)
tools/add_photos.py  사진 앨범 추가 도우미
index.html, research.html, members.html … 각 페이지
```
