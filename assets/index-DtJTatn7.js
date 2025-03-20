var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
})();
const createElement = (tag, { children, ...props } = {}) => {
  const element = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key in element) {
      element[key] = value;
      return;
    }
    if (!(key in element)) {
      element.setAttribute(key, value);
    }
  });
  if (children) {
    element.append(...children);
  }
  return element;
};
const Img = ({
  width = "",
  height = "",
  src,
  classList,
  props
}) => {
  const imgElement = createElement("img", {
    width,
    height,
    src,
    ...props
  });
  if (classList && classList.length > 0) {
    imgElement.classList.add(...classList);
  }
  return imgElement;
};
const Text = ({ classList, props }) => {
  const textElement = createElement("p", props);
  if (classList && classList.length > 0) {
    textElement.classList.add(...classList);
  }
  return textElement;
};
const Footer = () => {
  return createElement("footer", {
    classList: "footer",
    children: [
      Text({
        props: { textContent: "© 우아한테크코스 All Rights Reserved." }
      }),
      Img({
        width: "180",
        height: "30",
        src: "./images/woowacourse_logo.png"
      })
    ]
  });
};
const ENV = {
  VITE_API_URL: "https://api.themoviedb.org/3",
  VITE_TMBD_HEADER: "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5MjcwMTM3OTE2ZTUzYmI1Mjg2MzUyYmU3YWJjNTUyMiIsIm5iZiI6MTY4MzU0ODQ0OS4wNDQ5OTk4LCJzdWIiOiI2NDU4ZTkyMTc3ZDIzYjAxNzAzNzU1YmUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.QDQQ7HEqgZhnaF7yOGSJ1l7JVQvV1pKL3Go9BtvEVoA"
};
const STATUS_MESSAGE = {
  400: `🚨Bad Request🚨
 잘못된 요청입니다. 요청의 구문이 잘못되었습니다.`,
  401: `🔒Unauthorized🔒
 인증되지 않은 접근입니다. 인증이 필요합니다.`,
  403: `⛔️Forbidden⛔️
 접근이 거부되었습니다. 권한이 없습니다.`,
  404: `❌Not Found❌
 해당 자료를 찾을 수 없습니다.`,
  422: `🤔Unprocessable Entity🤔
 유효하지 않은 요청입니다.`,
  429: `🚨Too Many Requests🚨
 너무 많은 요청입니다. 잠시 후 다시 시도해 주세요`,
  500: `🔥Internal Server Error🔥
 서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.`,
  501: `❓Not Implemented❓
 서버가 요청을 처리할 수 없습니다. 잠시 후 다시 시도해주세요.`,
  502: `🚧Bad Gateway🚧
 게이트웨이 오류가 발생했습니다. 잠시 후 다시 시도해주세요.`,
  503: `⚒️Service Unavailable⚒️
 서버 점검 중입니다. 잠시 후 다시 시도해주세요.`,
  504: `⏰Gateway Timeout⏰
 게이트웨이 시간 초과가 발생했습니다. 잠시 후 다시 시도해주세요.`
};
class HttpError extends Error {
  constructor(status) {
    if (!Object.hasOwnProperty.call(STATUS_MESSAGE, status)) {
      throw new Error(`에러가 발생했어요. ${status}`);
    }
    super(STATUS_MESSAGE[status]);
    __publicField(this, "status");
  }
}
class Fetcher {
  constructor(baseUrl) {
    __publicField(this, "baseUrl");
    __publicField(this, "currentController", []);
    this.baseUrl = baseUrl;
  }
  async get(url) {
    this.cleanUp();
    const curHttpCtrl = new AbortController();
    const response = await fetch(`${this.baseUrl}/${url}`, {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${ENV.VITE_TMBD_HEADER}`
      },
      method: "GET",
      signal: curHttpCtrl.signal
    });
    if (!response.ok) {
      throw new HttpError(response.status);
    }
    return response.json();
  }
  cleanUp() {
    this.currentController.forEach((abortCtrl) => abortCtrl.abort());
  }
}
class MovieFetcherEvent {
  constructor() {
    __publicField(this, "listeners", []);
  }
  subscribe(listener) {
    this.listeners.push(listener);
    return () => this.unsubscribe(listener);
  }
  unsubscribe(listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }
  notify() {
    this.listeners.forEach((listener) => listener());
  }
}
const movieFetcherEvent = new MovieFetcherEvent();
const QUERY_PARAMS = {
  MOVIE: "movie/popular",
  SEARCH: "search/movie"
};
class MovieFetcher {
  constructor() {
    __publicField(this, "movieFetcher");
    __publicField(this, "isLoading", false);
    __publicField(this, "isSearch", false);
    __publicField(this, "query", "");
    __publicField(this, "currentPage", 1);
    __publicField(this, "movieResponse", {});
    __publicField(this, "movieResult", []);
    __publicField(this, "error", null);
    this.movieFetcher = new Fetcher(ENV.VITE_API_URL);
  }
  async fetchMovieData(url) {
    this.isLoading = true;
    this.error = null;
    movieFetcherEvent.notify();
    try {
      const response = await this.movieFetcher.get(url);
      await this.delay(3e3);
      this.updateMovieData(response);
      this.isLoading = false;
      movieFetcherEvent.notify();
      return response;
    } catch (error) {
      this.isLoading = false;
      this.error = error;
      movieFetcherEvent.notify();
    }
  }
  updateMovieData(response) {
    this.movieResponse = response;
    this.movieResult = [...this.movieResult, ...response.results];
  }
  async fetchMovies(url) {
    return await this.fetchMovieData(url);
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  async getPopularMovies(page) {
    this.isSearch = false;
    this.currentPage = page;
    const url = `${QUERY_PARAMS.MOVIE}?page=${page}`;
    return await this.fetchMovies(url);
  }
  async getNextPagePopularMovies() {
    await this.getPopularMovies(this.currentPage + 1);
  }
  async getSearchMovies(page, query) {
    this.movieResult = [];
    this.isSearch = true;
    this.currentPage = page;
    this.query = query;
    const url = `${QUERY_PARAMS.SEARCH}?query=${query}&page=${page}`;
    return await this.fetchMovies(url);
  }
  async getNextPageSearchMovies() {
    await this.getSearchMovies(this.currentPage + 1, this.query);
  }
  get movies() {
    return this.movieResult ?? [];
  }
  get isLoadingState() {
    return this.isLoading;
  }
  get isSearchState() {
    return this.isSearch;
  }
  get currentMovieResponse() {
    return this.movieResponse;
  }
  get queryText() {
    return this.query;
  }
  get errorState() {
    return this.error;
  }
}
const movieFetcher = new MovieFetcher();
const Box = ({ classList, props }) => {
  const boxElement = createElement("div", props);
  if (classList && classList.length > 0) {
    boxElement.classList.add(...classList);
  }
  return boxElement;
};
const Button = ({
  type = "button",
  height = "36",
  onClick,
  classList,
  props
}) => {
  const buttonElement = createElement("button", {
    type,
    ...props
  });
  if (classList && classList.length > 0) {
    buttonElement.classList.add(...classList);
  }
  if (height) {
    buttonElement.style.height = `${height}px`;
  }
  buttonElement.addEventListener("click", onClick);
  return buttonElement;
};
const IconButton = ({
  width,
  height,
  src,
  onClick,
  classList,
  props
}) => {
  return Button({
    type: "button",
    onClick,
    classList: ["border-none", ...classList || []],
    props: {
      ...props,
      children: [Img({ width, height, src })]
    }
  });
};
const SearchBar = ({ onSubmit, classList, props }) => {
  const input = createElement("input", {
    classList: "search-input",
    type: "text",
    placeholder: "검색어를 입력해주세요."
  });
  const iconBtn = IconButton({
    width: "16",
    height: "16",
    src: "images/search.png",
    onClick: () => onSubmit(input.value),
    classList,
    props
  });
  const formElement = createElement("form", {
    ...props,
    classList: "form-container",
    children: [input, iconBtn]
  });
  formElement.addEventListener("submit", (event) => {
    event.preventDefault();
    onSubmit(input.value);
  });
  return formElement;
};
const createHeaderSection = () => {
  return createElement("section", {
    classList: "section-container",
    children: [
      IconButton({
        width: "117",
        height: "20",
        src: "./images/logo.png",
        classList: ["logo"],
        onClick: () => {
          window.location.reload();
        },
        props: { alt: "MovieLogo" }
      }),
      SearchBar({
        classList: ["search-bar"],
        onSubmit: async (value) => {
          var _a, _b, _c;
          (_a = document.querySelector(".top-rated-movie")) == null ? void 0 : _a.replaceChildren();
          (_b = document.querySelector(".overlay")) == null ? void 0 : _b.classList.add("hidden");
          (_c = document.querySelector(".background-container")) == null ? void 0 : _c.classList.add("search-header-container");
          await movieFetcher.getSearchMovies(1, value);
        }
      })
    ]
  });
};
const createRatingSection$1 = () => {
  return Box({
    classList: ["rate"],
    props: {
      children: [
        Img({ width: "32", height: "32", src: "./images/star_empty.png" }),
        Text({
          classList: ["text-2xl", "font-semibold", "text-yellow"],
          props: { textContent: "9.5" }
        })
      ]
    }
  });
};
const createFeaturedMovieSection = () => {
  return Box({
    classList: ["top-rated-movie"],
    props: {
      children: [
        createRatingSection$1(),
        Text({
          classList: ["text-3xl", "font-semibold"],
          props: { textContent: "인사이드 아웃2" }
        }),
        Button({
          type: "button",
          onClick: () => {
          },
          classList: ["primary", "detail"],
          props: { textContent: "자세히 보기" }
        })
      ]
    }
  });
};
const createBackgroundContainer = () => {
  return Box({
    classList: ["background-container"],
    props: {
      children: [
        Box({
          classList: ["overlay"],
          props: {
            "aria-hidden": "true"
          }
        }),
        Box({
          classList: ["top-rated-container"],
          props: {
            children: [createHeaderSection(), createFeaturedMovieSection()]
          }
        })
      ]
    }
  });
};
const Header = () => {
  var _a;
  const headerElement = createElement("header", {
    children: [createBackgroundContainer()]
  });
  (_a = document.querySelector("#app")) == null ? void 0 : _a.appendChild(headerElement);
  return headerElement;
};
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w220_and_h330_face";
const DEFAULT_IMAGE_URL = "./images/no_image.png";
const createRatingSection = (vote_average) => {
  return Box({
    classList: ["movie-rate"],
    props: {
      children: [
        Img({
          width: "16",
          height: "16",
          src: "./images/star_empty.png"
        }),
        Text({
          classList: ["text-lg", "font-semibold", "text-yellow"],
          props: {
            textContent: `${vote_average}`
          }
        })
      ]
    }
  });
};
const createDescriptionSection = (title, vote_average) => {
  return Box({
    classList: ["movie-description"],
    props: {
      children: [
        createRatingSection(vote_average),
        Text({
          classList: ["text-xl", "font-bold"],
          props: {
            textContent: title
          }
        })
      ]
    }
  });
};
const createMovieImage = (title, poster_path) => {
  return Img({
    src: poster_path ? `${IMAGE_BASE_URL}${poster_path}` : DEFAULT_IMAGE_URL,
    classList: ["thumbnail"],
    props: {
      alt: title
    }
  });
};
const MovieItem = ({
  title,
  vote_average,
  poster_path
}) => {
  return createElement("li", {
    classList: "movie-item",
    children: [
      createMovieImage(title, poster_path),
      createDescriptionSection(title, vote_average)
    ]
  });
};
const SKELETON_ANIMATION = "animation: skeleton-gradient 1.5s infinite;";
const SKELETON_BASE_COLOR = "background-color: rgb(165, 165, 165);";
const createPosterSkeleton = () => {
  return createElement("div", {
    style: `width: 100%; height: 300px; ${SKELETON_BASE_COLOR} border-radius: 8px; margin-bottom: 12px; ${SKELETON_ANIMATION}`
  });
};
const createTitleSkeleton = () => {
  return createElement("div", {
    style: `width: 80%; height: 24px; ${SKELETON_BASE_COLOR} border-radius: 4px; margin-bottom: 8px; ${SKELETON_ANIMATION}`
  });
};
const createDateSkeleton = () => {
  return createElement("div", {
    style: `width: 50%; height: 16px; ${SKELETON_BASE_COLOR} border-radius: 4px; ${SKELETON_ANIMATION}`
  });
};
const MovieSkeleton = () => {
  const posterSkeleton = createPosterSkeleton();
  const titleSkeleton = createTitleSkeleton();
  const dateSkeleton = createDateSkeleton();
  return createElement("li", {
    classList: "movie-item skeleton-item",
    children: [posterSkeleton, titleSkeleton, dateSkeleton]
  });
};
const Empty = () => {
  return Box({
    classList: ["result-container"],
    props: {
      children: [
        Img({
          width: "72",
          height: "62",
          src: "./images/dizzy_planet.png"
        }),
        Text({
          classList: ["text-2xl", "font-semibold", "mt-24"],
          props: { textContent: "검색 결과가 없습니다." }
        })
      ]
    }
  });
};
const renderErrorState = () => {
  const error = movieFetcher.errorState;
  if (!error) return;
  titleText.style.display = "none";
  movieUl.style.display = "none";
  moreBtn.style.display = "none";
  const errorContainer = createElement("div", {
    classList: "error-container"
  });
  const errorMessage = Text({
    classList: ["text-2xl", "font-bold"],
    props: {
      textContent: error.message || "영화 정보를 불러오는 중 오류가 발생했습니다."
    }
  });
  errorContainer.append(errorMessage);
  sectionElement.insertBefore(errorContainer, movieUl);
};
const createSkeletonItems = (count = 20) => {
  return Array.from({ length: count }, () => MovieSkeleton());
};
const createMovieItems = (movies) => {
  return movies.map((movie) => MovieItem(movie));
};
const updateListTitle = (titleElement, isSearch, query) => {
  titleElement.textContent = isSearch ? `검색 결과: ${query}` : "인기 있는 영화";
};
const updateMoreButton = (button, currentPage, totalPages, isLoading = false) => {
  button.disabled = isLoading;
  button.textContent = isLoading ? "" : "더보기";
  button.style.display = currentPage >= totalPages ? "none" : "block";
  if (isLoading) {
    const loadingImg = Img({
      src: "./images/loading.png",
      width: "35",
      height: "35",
      classList: ["loading-spinner"]
    });
    button.innerHTML = "";
    button.appendChild(loadingImg);
  }
};
const titleText = Text({
  classList: ["text-2xl", "font-bold", "mb-32"],
  props: { textContent: "인기 있는 영화" }
});
let movieUl = createElement("ul", {
  classList: "thumbnail-list"
});
const moreBtn = Button({
  height: "48",
  classList: ["moreBtn", "w-full", "primary", "text-xl"],
  props: { textContent: "더보기" },
  onClick: async () => {
    await handleMoreButtonClick();
  }
});
const sectionElement = createElement("section", {
  classList: "container",
  children: [titleText, movieUl, moreBtn]
});
const mainElement = createElement("main", {
  children: [sectionElement]
});
const handleMoreButtonClick = async () => {
  const response = movieFetcher.currentMovieResponse;
  const hasNextPage = response.page < response.total_pages;
  if (!hasNextPage) return;
  updateMoreButton(moreBtn, response.page, response.total_pages, true);
  const isSearchMode = movieFetcher.isSearchState;
  await (isSearchMode ? movieFetcher.getNextPageSearchMovies() : movieFetcher.getNextPagePopularMovies());
};
const renderSearchLoadingState = (itemCount) => {
  const skeletons = createSkeletonItems(itemCount);
  movieUl.innerHTML = "";
  movieUl.append(...skeletons);
};
const renderMoreLoadingState = (itemCount) => {
  const skeletons = createSkeletonItems(itemCount);
  movieUl.append(...skeletons);
};
const renderEmptyState = () => {
  const emptyElement = Empty();
  movieUl.innerHTML = "";
  movieUl.appendChild(emptyElement);
  moreBtn.style.display = "none";
};
const renderMovies = (movies, response) => {
  const movieElements = createMovieItems(movies);
  movieUl.innerHTML = "";
  movieUl.append(...movieElements);
  updateMoreButton(moreBtn, response.page, response.total_pages);
};
const renderMovieList = () => {
  const results = movieFetcher.movies || [];
  const query = movieFetcher.queryText;
  const response = movieFetcher.currentMovieResponse;
  const isLoading = movieFetcher.isLoadingState;
  const isSearch = movieFetcher.isSearchState;
  const error = movieFetcher.errorState;
  updateListTitle(titleText, isSearch, query);
  if (error) {
    renderErrorState();
    return;
  }
  if (isLoading && isSearch) {
    renderSearchLoadingState(20);
    return;
  }
  if (isSearch && results.length === 0) {
    renderEmptyState();
    return;
  }
  if (isLoading) {
    renderMoreLoadingState(20);
    return;
  }
  renderMovies(results, response);
};
const MovieList = async () => {
  const app = document.querySelector("#app");
  if (app == null ? void 0 : app.firstChild) {
    app.insertBefore(mainElement, app.firstChild.nextSibling);
  }
  if (app) {
    app.appendChild(mainElement);
  }
  renderMoreLoadingState(20);
  await movieFetcher.getPopularMovies(1);
  renderMovieList();
  movieFetcherEvent.subscribe(renderMovieList);
  return mainElement;
};
const App = async () => {
  var _a;
  (_a = document.querySelector("#app")) == null ? void 0 : _a.append(Header(), await MovieList(), Footer());
};
addEventListener("load", () => {
  App();
});
