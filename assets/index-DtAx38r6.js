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
  width = "200",
  height = "300",
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
  VITE_TMDB_HEADER: "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5MjcwMTM3OTE2ZTUzYmI1Mjg2MzUyYmU3YWJjNTUyMiIsIm5iZiI6MTY4MzU0ODQ0OS4wNDQ5OTk4LCJzdWIiOiI2NDU4ZTkyMTc3ZDIzYjAxNzAzNzU1YmUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.QDQQ7HEqgZhnaF7yOGSJ1l7JVQvV1pKL3Go9BtvEVoA"
};
const STATUS_MESSAGE = {
  400: `🚨 요청이 올바르지 않습니다. 입력 내용을 확인해주세요. 🚨`,
  401: `🔒 인증되지 않은 요청입니다. 로그인 후 이용해주세요. 🔒`,
  403: `⛔️ 접근 권한이 없습니다. 관리자에게 문의하세요. ⛔️`,
  404: `❌ 요청하신 정보를 찾을 수 없습니다. ❌`,
  422: `🤔 입력값이 유효하지 않습니다. 다시 확인해주세요. 🤔`,
  429: `🚨 요청이 너무 많습니다. 잠시 후 다시 시도해주세요. 🚨`,
  500: `🔥 서버에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요. 🔥`,
  501: `❓ 요청을 처리할 수 없습니다. 나중에 다시 시도해주세요. ❓`,
  502: `🚧 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요. 🚧`,
  503: `⚒️ 현재 서버 점검 중입니다. 잠시 후 다시 시도해주세요. ⚒️`,
  504: `⏰ 응답 시간이 초과되었습니다. 다시 시도해주세요. ⏰`
};
const isValidStatusCode = (status) => {
  return Object.keys(STATUS_MESSAGE).includes(status.toString());
};
class HttpError extends Error {
  constructor(status) {
    const message = isValidStatusCode(status) ? STATUS_MESSAGE[status] : "알 수 없는 오류가 발생했습니다.";
    super(message);
    __publicField(this, "status");
    this.status = status;
  }
}
const HEADER_OPTION = {
  accept: "application/json",
  Authorization: `Bearer ${ENV.VITE_TMDB_HEADER}`
};
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
      headers: HEADER_OPTION,
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
const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
const API_PATH = {
  MOVIE: "movie/popular",
  SEARCH: "search/movie",
  DETAIL: "/movie/"
};
class MovieFetcher {
  constructor() {
    __publicField(this, "movieFetcher");
    __publicField(this, "state");
    __publicField(this, "query", "");
    __publicField(this, "currentPage", 1);
    this.movieFetcher = new Fetcher(ENV.VITE_API_URL);
    const initialState = {
      isLoading: false,
      isSearch: false,
      movieResponse: {
        page: 0,
        results: [],
        total_pages: 0,
        total_results: 0
      },
      movieResult: [],
      error: null
    };
    this.state = this.createStateProxy(initialState);
  }
  createStateProxy(initialState) {
    return new Proxy(initialState, {
      set: (obj, prop, value) => {
        const oldValue = obj[prop];
        obj[prop] = value;
        if (oldValue !== value) {
          movieFetcherEvent.notify();
        }
        return true;
      }
    });
  }
  async fetchMovieData(url) {
    this.state.isLoading = true;
    this.state.error = null;
    try {
      const response = await this.movieFetcher.get(url);
      this.state.isLoading = false;
      this.updateMovieData(response);
      return response;
    } catch (err) {
      if (err instanceof HttpError) {
        this.state.error = err;
        throw err;
      }
    }
  }
  updateMovieData(response) {
    this.state.movieResponse = response;
    this.state.movieResult = [...this.state.movieResult, ...response.results];
  }
  async getPopularMovies(page) {
    this.currentPage = page;
    const url = `${API_PATH.MOVIE}?page=${page}&language=ko-KR`;
    const res = await this.fetchMovieData(url);
    await delay(1e3);
    return res;
  }
  async getNextPagePopularMovies() {
    await this.getPopularMovies(this.currentPage + 1);
  }
  async getSearchMovies(page, query) {
    this.state.isLoading = true;
    this.state.isSearch = true;
    if (page === 1) {
      this.state.movieResult = [];
    }
    this.currentPage = page;
    this.query = query;
    const url = `${API_PATH.SEARCH}?query=${query}&page=${page}`;
    return await this.fetchMovieData(url);
  }
  async getMovieDetail(id) {
    const url = `${API_PATH.DETAIL}/${id}?language=ko-KR`;
    const res = await this.movieFetcher.get(url);
    return res;
  }
  async getNextPageSearchMovies() {
    await this.getSearchMovies(this.currentPage + 1, this.query);
  }
  get movies() {
    return this.state.movieResult ?? [];
  }
  get isLoadingState() {
    return this.state.isLoading;
  }
  get isSearchState() {
    return this.state.isSearch;
  }
  get currentMovieResponse() {
    return this.state.movieResponse;
  }
  get queryText() {
    return this.query;
  }
  get errorState() {
    return this.state.error;
  }
}
const movieFetcher = new MovieFetcher();
const SessionStorage = {
  getItems(storageKey) {
    const storedData = sessionStorage.getItem(storageKey);
    return storedData ? JSON.parse(storedData) : [];
  },
  saveItems(items, storageKey) {
    sessionStorage.setItem(storageKey, JSON.stringify(items));
  }
};
const _MovieRating = class _MovieRating {
  hasRating(movieId) {
    const storedData = SessionStorage.getItems(
      _MovieRating.STORAGE_KEY
    );
    return storedData.some((item) => item.movieId === movieId);
  }
  getRating(movieId) {
    const storedData = SessionStorage.getItems(
      _MovieRating.STORAGE_KEY
    );
    const movieIndex = storedData.find((item) => item.movieId === movieId);
    return movieIndex ? movieIndex.rate : null;
  }
  setRating(movieId, movieName, rate) {
    const storedData = SessionStorage.getItems(
      _MovieRating.STORAGE_KEY
    );
    const movieIndex = storedData.findIndex((item) => item.movieId === movieId);
    if (movieIndex > -1) {
      storedData[movieIndex].rate = rate;
    }
    if (movieIndex === -1 && rate > 0) {
      storedData.push({
        movieId,
        movieName,
        rate,
        rateDate: /* @__PURE__ */ new Date()
      });
    }
    SessionStorage.saveItems(storedData, _MovieRating.STORAGE_KEY);
  }
};
__publicField(_MovieRating, "STORAGE_KEY", "movie-ratings");
let MovieRating = _MovieRating;
const movieRating = new MovieRating();
const Box = ({ classList, props }) => {
  const boxElement = createElement("div", props);
  if (classList && classList.length > 0) {
    boxElement.classList.add(...classList);
  }
  return boxElement;
};
const Horizon = ({ classList, props }) => {
  const hrElement = createElement("hr", props);
  if (classList && classList.length > 0) {
    hrElement.classList.add(...classList);
  }
  return hrElement;
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
const Loading = () => {
  return Box({
    classList: ["flex-center"],
    props: {
      children: [
        Img({
          src: "./images/loading.png",
          width: "50",
          height: "50",
          classList: ["loading-spinner"]
        })
      ]
    }
  });
};
const Modal = (content) => {
  const modalBackground = Box({
    classList: ["modal-background", "active"],
    props: {
      children: [
        Box({
          classList: ["modal"],
          props: {
            children: [content]
          }
        })
      ]
    }
  });
  const closeModal = () => {
    modalBackground.classList.remove("active");
    modalBackground.addEventListener("transitionend", () => {
      modalBackground == null ? void 0 : modalBackground.remove();
    });
  };
  const handleModalClickClose = (event) => {
    const target = event.target;
    if (target.classList.contains("modal-background")) {
      closeModal();
    }
  };
  const handleModalEscClose = (event) => {
    if (event.key === "Escape") {
      closeModal();
    }
  };
  modalBackground.addEventListener("click", handleModalClickClose);
  document.addEventListener("keydown", handleModalEscClose);
  return modalBackground;
};
const createPosterSkeleton = () => {
  return Box({
    classList: ["skeleton-animation"],
    props: {
      style: `width: 200px; height: 300px;  border-radius: 8px;`
    }
  });
};
const createTitleSkeleton = () => {
  return Box({
    classList: ["skeleton-animation"],
    props: {
      style: `width: 50px; height: 20px;  border-radius: 4px;`
    }
  });
};
const createDateSkeleton = () => {
  return Box({
    classList: ["skeleton-animation"],
    props: {
      style: `width: 200px; height: 20px;  border-radius: 4px; margin-bottom: 18px;`
    }
  });
};
const createSkeletonItems = (count = 20) => {
  return Array.from({ length: count }, () => MovieSkeleton());
};
const MovieSkeleton = () => {
  return createElement("li", {
    classList: "movie-item skeleton-item",
    children: [
      createPosterSkeleton(),
      createTitleSkeleton(),
      createDateSkeleton()
    ]
  });
};
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w220_and_h330_face";
const DEFAULT_IMAGE_URL = "./images/no_image.png";
const createMovieItems = (movies) => {
  return movies.map((movie, index) => MovieItem({ ...movie, index }));
};
const createRatingSection$1 = (id, vote_average) => {
  const hasRating = movieRating.hasRating(id);
  return Box({
    classList: ["movie-rate"],
    props: {
      "data-movie-id": id.toString(),
      children: [
        Img({
          width: "16",
          height: "16",
          src: hasRating ? "./images/star_filled.png" : "./images/star_empty.png"
        }),
        Text({
          classList: ["text-lg", "font-semibold", "text-yellow", "mt-2"],
          props: {
            textContent: `${vote_average}`
          }
        })
      ]
    }
  });
};
const createDescriptionSection = (id, title, vote_average) => {
  return Box({
    classList: ["movie-description"],
    props: {
      children: [
        createRatingSection$1(id, vote_average),
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
  const imageContainer = Box({
    classList: ["image-container"]
  });
  const skeletonElement = createPosterSkeleton();
  skeletonElement.classList.add("skeleton-overlay");
  const imgElement = Img({
    src: poster_path ? `${IMAGE_BASE_URL}${poster_path}` : DEFAULT_IMAGE_URL,
    classList: ["thumbnail"],
    props: {
      alt: title,
      style: "visibility: hidden"
    }
  });
  const handleImageLoad = () => {
    skeletonElement.classList.add("fade-out");
    imgElement.style.visibility = "visible";
    requestAnimationFrame(() => skeletonElement.remove());
  };
  imgElement.addEventListener("load", handleImageLoad);
  imageContainer.append(imgElement, skeletonElement);
  return imageContainer;
};
const MovieItem = ({
  index,
  ...movieItem
}) => {
  const { id, title, vote_average, poster_path } = movieItem;
  const item = createElement("li", {
    classList: "movie-item",
    children: [
      createMovieImage(title, poster_path),
      createDescriptionSection(id, title, vote_average)
    ]
  });
  item.setAttribute("data-index", index.toString());
  const modal = document.querySelector("#modal");
  item.addEventListener("click", async () => {
    modal == null ? void 0 : modal.appendChild(Modal(Loading()));
    const detailData = await movieFetcher.getMovieDetail(id);
    if (detailData) {
      modal == null ? void 0 : modal.replaceChildren(Modal(MovieDetailModal(detailData)));
    }
  });
  return item;
};
const SCORE_TEXT = {
  2: "최악이에요.",
  4: "별로예요.",
  6: "보통이에요.",
  8: "재미있어요.",
  10: "명작이에요."
};
const handleCloseBtnClick = () => {
  const modalBackground = document.querySelector(".modal-background");
  modalBackground == null ? void 0 : modalBackground.classList.remove("active");
  modalBackground == null ? void 0 : modalBackground.addEventListener(
    "transitionend",
    () => {
      modalBackground == null ? void 0 : modalBackground.remove();
    },
    { once: true }
  );
};
const scoreTextElement = Text({
  classList: ["text-xl", "font-semibold", "text-white"]
});
const scoreElement = Text({
  classList: ["text-lg", "font-semibold", "text-opacity-blue"],
  props: {
    textContent: "(0/10)"
  }
});
const movieInfo = (title, formattedReleaseDate, genreNames, vote_average) => {
  return Box({
    classList: ["modal-info"],
    props: {
      children: [
        Text({
          classList: ["text-xl", "font-bold"],
          props: {
            textContent: title
          }
        }),
        Text({
          classList: ["text-lg", "font-semibold", "text-white"],
          props: {
            textContent: `${formattedReleaseDate} | ${genreNames}`
          }
        }),
        Box({
          classList: ["movie-rate"],
          props: {
            children: [
              Text({
                classList: ["text-lg", "font-semibold", "text-white"],
                props: {
                  textContent: "평점"
                }
              }),
              Box({
                classList: ["flex-row"],
                props: {
                  children: [
                    Img({
                      width: "20",
                      height: "20",
                      src: "./images/star_filled.png"
                    }),
                    Text({
                      classList: ["text-lg", "font-semibold", "text-yellow"],
                      props: {
                        textContent: ` ${vote_average}`
                      }
                    })
                  ]
                }
              })
            ]
          }
        })
      ]
    }
  });
};
const myRatingSection = (movieId, title) => {
  const updateStars = (score) => {
    movieRating.setRating(movieId, title, score);
    starElements.forEach((star, index) => {
      const starScore = (index + 1) * 2;
      const starImg = star.querySelector("img");
      if (starImg) {
        starImg.src = starScore <= score ? "./images/star_filled.png" : "./images/star_empty.png";
      }
    });
    scoreTextElement.textContent = SCORE_TEXT[score] || "별점을 남겨주세요! 🌟";
    scoreElement.textContent = `(${score}/10)`;
  };
  const starElements = Array.from({ length: 5 }, (_, index) => {
    const starScore = (index + 1) * 2;
    return IconButton({
      width: "25",
      height: "25",
      src: "./images/star_empty.png",
      onClick: () => updateStars(starScore),
      props: {
        alt: `Star ${index + 1}`
      }
    });
  });
  const storedRating = movieRating.getRating(movieId);
  updateStars(storedRating || 0);
  return Box({
    classList: ["modal-my-rate"],
    props: {
      children: [
        Text({
          classList: ["text-xl", "font-semibold"],
          props: {
            textContent: "내 별점"
          }
        }),
        Box({
          classList: ["modal-rate"],
          props: {
            children: [
              Box({
                classList: ["flex-row"],
                props: {
                  children: starElements
                }
              }),
              Box({
                classList: ["flex-row"],
                props: {
                  children: [scoreTextElement, scoreElement]
                }
              })
            ]
          }
        })
      ]
    }
  });
};
const overView = (overview) => {
  return Box({
    props: {
      children: [
        Text({
          classList: ["text-xl", "font-semibold"],
          props: {
            textContent: "줄거리"
          }
        }),
        Box({
          classList: ["detail"],
          props: {
            children: [
              Text({
                props: {
                  textContent: overview ? overview : "줄거리 정보가 없습니다."
                }
              })
            ]
          }
        })
      ]
    }
  });
};
const MovieDetailModal = (movieDetailData) => {
  const {
    id,
    title,
    release_date,
    genres,
    overview,
    vote_average,
    poster_path
  } = movieDetailData;
  const formattedReleaseDate = new Date(release_date).getFullYear();
  const genreNames = genres.map((genre) => genre.name).join(", ");
  return Box({
    classList: ["modal-col"],
    props: {
      children: [
        IconButton({
          width: "15",
          height: "15",
          src: "./images/modal_button_close.png",
          classList: ["modal-close-btn"],
          onClick: () => handleCloseBtnClick()
        }),
        Box({
          classList: ["modal-container"],
          props: {
            children: [
              Img({
                src: poster_path ? `${IMAGE_BASE_URL}${poster_path}` : DEFAULT_IMAGE_URL,
                classList: ["modal-image"],
                props: {
                  alt: title
                }
              }),
              Box({
                classList: ["modal-description"],
                props: {
                  children: [
                    movieInfo(
                      title,
                      formattedReleaseDate,
                      genreNames,
                      vote_average
                    ),
                    Horizon({ classList: ["custom-hr"] }),
                    myRatingSection(id, title),
                    Horizon({ classList: ["custom-hr"] }),
                    overView(overview)
                  ]
                }
              })
            ]
          }
        })
      ]
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
const Skeleton = ({
  width,
  height,
  classList,
  props
}) => {
  return Box({
    classList: ["skeleton-gradient", ...classList || []],
    props: {
      style: `width: ${width}px; height: ${height}px;`,
      ...props
    }
  });
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
        onSubmit: async (value) => await movieFetcher.getSearchMovies(1, value)
      })
    ]
  });
};
const createRatingSection = (rate) => {
  return Box({
    classList: ["rate"],
    props: {
      children: [
        Img({ width: "32", height: "32", src: "./images/star_empty.png" }),
        Text({
          classList: ["text-2xl", "font-semibold", "text-yellow"],
          props: { textContent: `${rate}` }
        })
      ]
    }
  });
};
const createFeaturedMovieSection = (id, title, rate) => {
  const openMovieDetailModal = async (movieId) => {
    const modal = document.querySelector("#modal");
    modal == null ? void 0 : modal.appendChild(Modal(Loading()));
    const detailData = await movieFetcher.getMovieDetail(movieId);
    if (detailData) {
      modal == null ? void 0 : modal.replaceChildren(Modal(MovieDetailModal(detailData)));
    }
  };
  return Box({
    classList: ["top-rated-movie"],
    props: {
      children: [
        createRatingSection(rate),
        Text({
          classList: ["text-3xl", "font-semibold"],
          props: { textContent: title }
        }),
        Button({
          type: "button",
          onClick: () => openMovieDetailModal(id),
          classList: ["primary", "detail"],
          props: { textContent: "자세히 보기" }
        })
      ]
    }
  });
};
const createBackgroundContainer = (movie) => {
  const { id, title, vote_average, poster_path } = movie;
  const isSearch = movieFetcher.isSearchState;
  const backgroundClassList = [
    "background-container",
    ...isSearch ? ["search-header-container"] : []
  ];
  const backgroundStyle = isSearch ? "" : `background-image: url(https://image.tmdb.org/t/p/w1920_and_h800_multi_faces/${poster_path})`;
  return Box({
    classList: backgroundClassList,
    props: {
      style: backgroundStyle,
      children: [
        Box({
          classList: !isSearch ? ["overlay"] : [],
          props: {
            "aria-hidden": "true"
          }
        }),
        Box({
          classList: ["top-rated-container"],
          props: {
            children: [
              createHeaderSection(),
              ...isSearch ? [] : [createFeaturedMovieSection(id, title, vote_average)]
            ]
          }
        })
      ]
    }
  });
};
const renderHeader = (headerElement) => {
  const {
    isLoadingState: isLoading,
    isSearchState: isSearch,
    movies
  } = movieFetcher;
  const existingSkeleton = headerElement.querySelector(".skeleton-gradient");
  if (existingSkeleton) {
    existingSkeleton.remove();
  }
  if (isLoading && !isSearch && movies.length === 0) {
    headerElement.appendChild(Skeleton({ width: 1980, height: 500 }));
    headerElement.classList.add("skeleton-animation");
    return;
  }
  if (movies.length > 0) {
    headerElement.replaceChildren(createBackgroundContainer(movies[0]));
  }
  headerElement.classList.remove("skeleton-animation");
};
const Header = () => {
  var _a;
  const headerElement = createElement("header", {});
  renderHeader(headerElement);
  movieFetcherEvent.subscribe(() => renderHeader(headerElement));
  (_a = document.querySelector("#app")) == null ? void 0 : _a.appendChild(headerElement);
  return headerElement;
};
let activeToast = null;
const createToast = () => {
  if (activeToast && activeToast.parentElement) {
    activeToast.parentElement.removeChild(activeToast);
  }
  const errorState = movieFetcher.errorState;
  const errorMessage = (errorState == null ? void 0 : errorState.message) || "오류가 발생했습니다";
  const toast = Box({
    classList: ["toast"],
    props: {
      children: [
        Box({
          classList: ["flex-col"],
          props: {
            children: [
              Text({
                props: {
                  textContent: errorMessage
                }
              }),
              Box({
                classList: ["toast-button-container"],
                props: {
                  children: [
                    Button({
                      classList: ["retry-button"],
                      onClick: () => {
                        window.location.reload();
                      },
                      props: {
                        textContent: "재시도"
                      }
                    }),
                    Button({
                      type: "button",
                      classList: ["close-button"],
                      onClick: () => {
                        toast.style.display = "none";
                      },
                      props: {
                        textContent: "닫기"
                      }
                    })
                  ]
                }
              })
            ]
          }
        })
      ]
    }
  });
  const modal = document.querySelector("#modal");
  if (modal) {
    modal.appendChild(toast);
    activeToast = toast;
  }
  return toast;
};
const Toast = () => {
  movieFetcherEvent.subscribe(() => {
    if (movieFetcher.errorState) {
      createToast();
    }
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
let observer = null;
const initObserver = (callback) => {
  if (!observer) {
    observer = new IntersectionObserver(callback, {
      root: null,
      rootMargin: "100px",
      threshold: 1
    });
  }
};
const observeTarget = (target) => {
  if (!observer) return;
  observer.disconnect();
  observer.observe(target);
};
const titleText = Text({
  classList: ["text-2xl", "font-bold", "mb-64"],
  props: { textContent: "지금 인기 있는 영화" }
});
const movieUl = createElement("ul", {
  classList: "thumbnail-list"
});
const sectionElement = createElement("section", {
  classList: "container",
  children: [titleText, movieUl]
});
const mainElement = createElement("main", {
  children: [sectionElement]
});
const updateListTitle = (titleElement, isSearch, query) => {
  titleElement.textContent = isSearch ? `검색 결과: ${query}` : "지금 인기 있는 영화";
};
const handleMoreMovieData = async () => {
  const response = movieFetcher.currentMovieResponse;
  const hasNextPage = response.page < response.total_pages;
  if (!hasNextPage) return;
  await (movieFetcher.isSearchState ? movieFetcher.getNextPageSearchMovies() : movieFetcher.getNextPagePopularMovies());
};
const observerCallback = async (entries) => {
  const entry = entries[0];
  if (entry.isIntersecting && !movieFetcher.isLoadingState) {
    await handleMoreMovieData();
  }
};
const setupIntersectionObserver = () => {
  const lastMovieItem = document.querySelector(".movie-item:last-child");
  if (!lastMovieItem) return;
  initObserver(observerCallback);
  observeTarget(lastMovieItem);
};
const renderMoreLoadingState = (itemCount) => {
  const skeletons = createSkeletonItems(itemCount);
  movieUl.append(...skeletons);
};
const renderEmptyState = () => {
  const emptyElement = Empty();
  movieUl.innerHTML = "";
  movieUl.appendChild(emptyElement);
};
const renderMovies = (movies) => {
  const movieElements = createMovieItems(movies);
  movieUl.innerHTML = "";
  movieUl.append(...movieElements);
};
const renderMovieList = () => {
  const {
    movies: results,
    queryText: query,
    isLoadingState: isLoading,
    isSearchState: isSearch,
    errorState: error
  } = movieFetcher;
  updateListTitle(titleText, isSearch, query);
  if (error) return;
  if (isLoading && !(isSearch && results.length === 0)) {
    return renderMoreLoadingState(20);
  }
  if (isSearch && results.length === 0 && !isLoading) {
    return renderEmptyState();
  }
  renderMovies(results);
  setupIntersectionObserver();
};
const MovieList = () => {
  const app = document.querySelector("#app");
  app == null ? void 0 : app.append(mainElement);
  movieFetcher.getPopularMovies(1);
  renderMovieList();
  movieFetcherEvent.subscribe(renderMovieList);
  return mainElement;
};
const App = () => {
  var _a;
  Toast();
  (_a = document.querySelector("#app")) == null ? void 0 : _a.append(Header(), MovieList(), Footer());
};
addEventListener("load", () => {
  App();
});
