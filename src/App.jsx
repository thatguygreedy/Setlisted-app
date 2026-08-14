import React, { useState, useMemo, useEffect } from "react";
import { Search, Radio, Heart, Filter, X, Menu, Compass, ListMusic, User, Loader2, Newspaper, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

const SUPABASE_URL = "https://dohpearjxpuxgcoxrctx.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_DSYzu4lm_mqN06q282GdHw__oPUuH08";
const NEWS_RSS_URL = "https://feeds.feedburner.com/DJmag-LatestNews";
const NEWS_API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(NEWS_RSS_URL)}`;

const supabaseHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

const FOLLOWED_STORAGE_KEY = "setlisted:followed";

function loadFollowed() {
  try {
    const raw = localStorage.getItem(FOLLOWED_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveFollowed(followedSet) {
  try {
    localStorage.setItem(FOLLOWED_STORAGE_KEY, JSON.stringify(Array.from(followedSet)));
  } catch {
    // ignore write failures (e.g. private browsing)
  }
}

function timeAgo(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function spotifySearchUrl(title, artist) {
  const q = encodeURIComponent(`${title} ${artist}`);
  return `https://open.spotify.com/search/${q}`;
}

function EqBars({ active }) {
  return (
    <span
      style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 12, marginRight: 6 }}
      aria-hidden="true"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 2.5,
            background: active ? "#2EE6B8" : "#5B5F7E",
            borderRadius: 1,
            animation: active ? `eqbar 0.9s ease-in-out ${i * 0.15}s infinite` : "none",
            height: active ? undefined : 4,
          }}
        />
      ))}
    </span>
  );
}

function GenrePill({ genre }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10.5,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        color: "#A6ABCB",
        background: "#1C2038",
        border: "1px solid #2A2F4D",
        borderRadius: 4,
        padding: "3px 7px",
      }}
    >
      {genre || "Unknown"}
    </span>
  );
}

function TrackRow({ track, isLast }) {
  return (
    <button
      onClick={() => window.open(spotifySearchUrl(track.title, track.artist), "_blank", "noopener,noreferrer")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        background: "transparent",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        paddingBottom: 8,
        paddingTop: 2,
        borderBottom: isLast ? "none" : "1px solid #1C2038",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 13.5,
            color: "#C7CAE3",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {track.title}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: "#6E7295",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {track.artist}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 10 }}>
        <GenrePill genre={track.genre} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: "#5B5F7E" }}>
          {timeAgo(track.played_at)}
        </span>
        <ExternalLink size={12} color="#5B5F7E" />
      </div>
    </button>
  );
}

function StationCard({ station, followed, onToggleFollow, expanded, onToggleExpand }) {
  const [current, ...rest] = station.tracks;
  const isLive = current && Date.now() - new Date(current.played_at).getTime() < 20 * 60 * 1000;
  const recent = expanded ? rest : rest.slice(0, 3);

  return (
    <div
      style={{
        background: "#14172A",
        border: "1px solid #232748",
        borderRadius: 14,
        padding: "18px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <button
          onClick={onToggleExpand}
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            textAlign: "left",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "linear-gradient(160deg, #FF3E6C 0%, #7A1E3A 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 20,
              color: "#0B0D17",
              flexShrink: 0,
            }}
          >
            {station.dj.charAt(0)}
          </div>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 22,
                letterSpacing: 0.5,
                color: "#EDEBFA",
                lineHeight: 1.1,
              }}
            >
              {station.dj}
              {rest.length > 0 && (expanded ? <ChevronUp size={16} color="#7D82A6" /> : <ChevronDown size={16} color="#7D82A6" />)}
            </div>
            <div style={{ fontSize: 12.5, color: "#7D82A6" }}>
              {station.show} · {station.network}
            </div>
          </div>
        </button>
        <button
          onClick={() => onToggleFollow(station.id)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: followed ? "#FF3E6C" : "transparent",
            border: followed ? "1px solid #FF3E6C" : "1px solid #2A2F4D",
            color: followed ? "#1C0410" : "#C7CAE3",
            fontSize: 12.5,
            fontWeight: 600,
            padding: "7px 12px",
            borderRadius: 8,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Heart size={13} fill={followed ? "#1C0410" : "none"} />
          {followed ? "Following" : "Follow"}
        </button>
      </div>

      {current ? (
        <button
          onClick={() => window.open(spotifySearchUrl(current.title, current.artist), "_blank", "noopener,noreferrer")}
          style={{
            background: "#0F1223",
            border: "1px solid #1E2340",
            borderRadius: 10,
            padding: "12px 14px",
            textAlign: "left",
            cursor: "pointer",
            width: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10.5,
                letterSpacing: 0.6,
                color: isLive ? "#2EE6B8" : "#7D82A6",
                textTransform: "uppercase",
              }}
            >
              <EqBars active={isLive} />
              {isLive ? "Recently played" : "Last played"}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#5B5F7E" }}>
              {timeAgo(current.played_at)}
            </span>
          </div>
          <div style={{ fontSize: 15.5, color: "#EDEBFA", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
            {current.title}
            <ExternalLink size={13} color="#5B5F7E" />
          </div>
          <div style={{ fontSize: 12.5, color: "#9498BC", marginBottom: 8 }}>{current.artist}</div>
          <GenrePill genre={current.genre} />
        </button>
      ) : (
        <div style={{ fontSize: 12.5, color: "#5B5F7E", fontStyle: "italic" }}>
          No tracks logged yet for this station.
        </div>
      )}

      {recent.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recent.map((t, i) => (
            <TrackRow key={t.id} track={t} isLast={i === recent.length - 1} />
          ))}
        </div>
      )}

      {!expanded && rest.length > 3 && (
        <button
          onClick={onToggleExpand}
          style={{
            background: "transparent",
            border: "none",
            color: "#7D82A6",
            fontSize: 11.5,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: "pointer",
            padding: "2px 0",
            textAlign: "center",
          }}
        >
          + {rest.length - 3} more tracks
        </button>
      )}
    </div>
  );
}

function NewsCard({ item }) {
  return (
    <button
      onClick={() => window.open(item.link, "_blank", "noopener,noreferrer")}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        width: "100%",
        textAlign: "left",
        background: "#14172A",
        border: "1px solid #232748",
        borderRadius: 12,
        padding: "14px 16px",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#2EE6B8", textTransform: "uppercase" }}>
          DJ Mag
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#5B5F7E" }}>
          {item.pubDate ? timeAgo(item.pubDate) : ""}
        </span>
      </div>
      <div style={{ fontSize: 14, color: "#EDEBFA", fontWeight: 600, lineHeight: 1.3 }}>{item.title}</div>
      {item.description && (
        <div
          style={{
            fontSize: 12,
            color: "#9498BC",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {item.description}
        </div>
      )}
      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#7D82A6" }}>
        Read more <ExternalLink size={11} />
      </span>
    </button>
  );
}

export default function App() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [genre, setGenre] = useState("All");
  const [query, setQuery] = useState("");
  const [followed, setFollowed] = useState(() => loadFollowed());
  const [expandedStations, setExpandedStations] = useState(() => new Set());
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");

  const [news, setNews] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadData(isBackground) {
      try {
        if (!isBackground) setLoading(true);
        setLoadError(null);

        const [stationsRes, tracksRes] = await Promise.all([
          fetch(`${SUPABASE_URL}stations?select=*&active=eq.true`, { headers: supabaseHeaders }),
          fetch(`${SUPABASE_URL}tracks?select=*&order=played_at.desc&limit=300`, { headers: supabaseHeaders }),
        ]);

        if (!stationsRes.ok) throw new Error(`Stations request failed: ${stationsRes.status}`);
        if (!tracksRes.ok) throw new Error(`Tracks request failed: ${tracksRes.status}`);

        const stationsData = await stationsRes.json();
        const tracksData = await tracksRes.json();

        const merged = stationsData.map((s) => ({
          ...s,
          tracks: tracksData.filter((t) => t.station_id === s.id),
        }));

        if (!cancelled) {
          setStations(merged);
          setLastUpdated(new Date());
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled && !isBackground) setLoading(false);
      }
    }

    loadData(false);
    const interval = setInterval(() => loadData(true), 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadNews() {
      try {
        setNewsLoading(true);
        setNewsError(null);
        const res = await fetch(NEWS_API_URL);
        if (!res.ok) throw new Error(`News request failed: ${res.status}`);
        const data = await res.json();
        if (data.status !== "ok") throw new Error("News feed unavailable");
        if (!cancelled) setNews(data.items || []);
      } catch (err) {
        if (!cancelled) setNewsError(err.message);
      } finally {
        if (!cancelled) setNewsLoading(false);
      }
    }

    loadNews();
  }, []);

  const genres = useMemo(() => {
    const set = new Set();
    stations.forEach((s) => s.tracks.forEach((t) => t.genre && set.add(t.genre)));
    return ["All", ...Array.from(set).sort()];
  }, [stations]);

  const toggleFollow = (id) => {
    setFollowed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveFollowed(next);
      return next;
    });
  };

  const toggleExpand = (id) => {
    setExpandedStations((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return stations.filter((s) => {
      if (activeTab === "following" && !followed.has(s.id)) return false;
      if (genre !== "All" && !s.tracks.some((t) => t.genre === genre)) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = [s.dj, s.show, ...s.tracks.map((t) => `${t.title} ${t.artist}`)].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [genre, query, activeTab, followed, stations]);

  const totalTracks = useMemo(() => stations.reduce((sum, s) => sum + s.tracks.length, 0), [stations]);

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "#0B0D17",
        minHeight: "100vh",
        color: "#EDEBFA",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes eqbar { 0%, 100% { height: 4px; } 50% { height: 12px; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: #2A2F4D; border-radius: 3px; }
        input::placeholder { color: #5B5F7E; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "#0B0D17",
            borderBottom: "1px solid #1C2038",
            padding: "18px 18px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Radio size={20} color="#FF3E6C" />
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 1, color: "#EDEBFA" }}>
                SETLISTED
              </span>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#5B5F7E" }}>
              {lastUpdated ? `Updated ${timeAgo(lastUpdated.toISOString())}` : ""}
            </span>
          </div>

          {(activeTab === "feed" || activeTab === "following") && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#14172A",
                    border: "1px solid #232748",
                    borderRadius: 9,
                    padding: "9px 12px",
                  }}
                >
                  <Search size={15} color="#5B5F7E" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search DJs, shows, tracks"
                    style={{ background: "transparent", border: "none", outline: "none", color: "#EDEBFA", fontSize: 13.5, width: "100%" }}
                  />
                  {query && <X size={14} color="#5B5F7E" style={{ cursor: "pointer" }} onClick={() => setQuery("")} />}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14 }}>
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGenre(g)}
                    style={{
                      flexShrink: 0,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11.5,
                      letterSpacing: 0.3,
                      textTransform: "uppercase",
                      padding: "7px 12px",
                      borderRadius: 7,
                      border: genre === g ? "1px solid #2EE6B8" : "1px solid #232748",
                      background: genre === g ? "rgba(46,230,184,0.12)" : "transparent",
                      color: genre === g ? "#2EE6B8" : "#7D82A6",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </>
          )}

          {activeTab === "discover" && (
            <div style={{ paddingBottom: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#7D82A6" }}>
              Latest EDM news, powered by DJ Mag
            </div>
          )}
        </div>

        <div style={{ padding: "16px 18px 90px", display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
          {activeTab === "profile" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#14172A", border: "1px solid #232748", borderRadius: 14, padding: 20 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, marginBottom: 12 }}>YOUR STATS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#C7CAE3" }}>
                  <div>Following {followed.size} station{followed.size === 1 ? "" : "s"}</div>
                  <div>Tracking {stations.length} station{stations.length === 1 ? "" : "s"} total</div>
                  <div>{totalTracks} tracks logged</div>
                  <div>{genres.length - 1} genres represented</div>
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: "#5B5F7E", textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
                Data refreshes automatically every minute
              </div>
            </div>
          ) : activeTab === "discover" ? (
            newsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 60, color: "#5B5F7E" }}>
                <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: 13 }}>Loading news…</span>
              </div>
            ) : newsError ? (
              <div style={{ textAlign: "center", color: "#FF3E6C", fontSize: 13, marginTop: 60 }}>
                Couldn't load news: {newsError}
              </div>
            ) : (
              news.map((item, i) => <NewsCard key={i} item={item} />)
            )
          ) : loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 60, color: "#5B5F7E" }}>
              <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: 13 }}>Loading live data…</span>
            </div>
          ) : loadError ? (
            <div style={{ textAlign: "center", color: "#FF3E6C", fontSize: 13, marginTop: 60 }}>
              Couldn't load data: {loadError}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "#5B5F7E", fontSize: 13.5, marginTop: 60 }}>
              {activeTab === "following" ? "You're not following any stations yet." : "No shows match those filters."}
            </div>
          ) : (
            filtered.map((s) => (
              <StationCard
                key={s.id}
                station={s}
                followed={followed.has(s.id)}
                onToggleFollow={toggleFollow}
                expanded={expandedStations.has(s.id)}
                onToggleExpand={() => toggleExpand(s.id)}
              />
            ))
          )}
        </div>

        <div
          style={{
            position: "fixed",
            bottom: 0,
            width: "100%",
            maxWidth: 460,
            background: "#0F1223",
            borderTop: "1px solid #1C2038",
            display: "flex",
            justifyContent: "space-around",
            padding: "10px 0 14px",
          }}
        >
          {[
            { id: "feed", icon: ListMusic, label: "Feed" },
            { id: "discover", icon: Newspaper, label: "Discover" },
            { id: "following", icon: Heart, label: "Following" },
            { id: "profile", icon: User, label: "Profile" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Icon size={19} color={activeTab === id ? "#FF3E6C" : "#5B5F7E"} />
              <span style={{ fontSize: 10, color: activeTab === id ? "#FF3E6C" : "#5B5F7E" }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
