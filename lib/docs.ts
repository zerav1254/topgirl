import type { Locale } from "./i18n.ts";

export type DocKey = "help" | "privacy" | "legal";

export const DOC_KEYS: DocKey[] = ["help", "privacy", "legal"];

export type DocSection = { title: string; body: string };

export type Doc = { title: string; intro: string; sections: DocSection[] };

// Halaman statis (bantuan, privasi, legal). Teks per bahasa, bukan di DB.
export const DOCS: Record<Locale, Record<DocKey, Doc>> = {
  id: {
    help: {
      title: "Bantuan",
      intro: "Panduan singkat memakai TopGirl Team Builder.",
      sections: [
        {
          title: "Pilih season server",
          body: "Chip season di atas daftar artist menentukan batas atas artis yang bisa kamu peroleh. Artis di atas season server tetap tampil di section Belum bisa diperoleh dan tetap boleh dipilih, tapi diberi peringatan.",
        },
        {
          title: "Menyusun tim",
          body: "Buka tab Team Builder, klik slot, lalu pilih artist. Tombol Susun tim terbaik mengisi 5 slot dari kombinasi skor tertinggi yang bisa diperoleh; bonus genre dipakai untuk memecah seri.",
        },
        {
          title: "Koleksi",
          body: "Masuk dengan Google atau Discord, lalu tandai artist yang sudah kamu miliki. Koleksi tersimpan di akun dan dipakai untuk filter.",
        },
        {
          title: "Lineup dan tautan",
          body: "Simpan tim sebagai lineup di tab Lineup. Bagikan lewat tautan unlisted; mencabut tautan membuat lineup kembali privat. Lineup yang dibagikan ikut tampil di profil publikmu.",
        },
        {
          title: "Skor dan tier",
          body: "Rank dihitung dari skill artist, bukan base stat. Rumus, bobot per kategori, dan ambang tier ada di halaman Info rank.",
        },
      ],
    },
    privacy: {
      title: "Privasi",
      intro: "Ringkasan data yang diproses TopGirl dan cara kamu mengendalikannya.",
      sections: [
        {
          title: "Data yang disimpan",
          body: "Saat masuk dengan Google atau Discord kami menyimpan email, nama tampilan, dan URL avatar dari provider. Kamu bisa menambahkan nickname serta ID/server game di halaman Profil.",
        },
        {
          title: "Data yang kamu buat",
          body: "Koleksi artist dan lineup (termasuk nama lineup) disimpan di Supabase. Lineup privat hanya bisa dibuka oleh pemiliknya.",
        },
        {
          title: "Yang tampil publik",
          body: "Hanya lineup yang kamu bagikan yang bisa dibuka lewat tautan, dan ikut tampil di profil publik berisi nama, nickname, server, serta lineup yang dibagikan.",
        },
        {
          title: "Cookie",
          body: "Cookie hanya dipakai untuk sesi login (Supabase Auth). Tidak ada cookie iklan atau pelacak pihak ketiga; analitik Vercel berjalan tanpa cookie.",
        },
        {
          title: "Menghapus data",
          body: "Kamu bisa keluar kapan saja dari halaman Profil. Untuk penghapusan akun beserta datanya, hubungi pemilik situs lewat kanal Discord/GitHub repositori.",
        },
      ],
    },
    legal: {
      title: "Legal",
      intro: "Ketentuan pemakaian TopGirl Team Builder.",
      sections: [
        {
          title: "Bukan afiliasi resmi",
          body: "TopGirl adalah proyek penggemar dan tidak berafiliasi dengan pengembang atau penerbit game. Semua nama artist, skill, dan istilah game milik pemegang haknya.",
        },
        {
          title: "Akurasi data",
          body: "Stat dan season dikumpulkan manual dan bisa berbeda dengan versi game terbaru. Gunakan sebagai perkiraan, bukan patokan resmi.",
        },
        {
          title: "Konten pengguna",
          body: "Kamu bertanggung jawab atas nama lineup dan data profil yang diisi. Jangan mengunggah konten yang melanggar hukum atau hak orang lain.",
        },
        {
          title: "Tanpa jaminan",
          body: "Layanan disediakan apa adanya, tanpa jaminan ketersediaan atau bebas galat. Fitur bisa berubah atau dihentikan sewaktu-waktu.",
        },
        {
          title: "Perubahan ketentuan",
          body: "Ketentuan dapat diperbarui. Versi terbaru selalu tersedia di halaman ini.",
        },
      ],
    },
  },
  en: {
    help: {
      title: "Help",
      intro: "A quick guide to the TopGirl Team Builder.",
      sections: [
        {
          title: "Pick your server season",
          body: "The season chips above the artist list set the highest artist you can obtain. Artists above your server season still show up under Not obtainable yet and can still be picked, with a warning.",
        },
        {
          title: "Building a team",
          body: "Open the Team Builder tab, click a slot, then pick an artist. Build the best team fills all 5 slots with the highest-scoring obtainable combination; genre bonus breaks ties.",
        },
        {
          title: "Collection",
          body: "Sign in with Google or Discord, then mark the artists you own. Your collection is stored with your account and used for filtering.",
        },
        {
          title: "Lineups and links",
          body: "Save a team as a lineup in the Lineup tab. Share it with an unlisted link; revoking the link makes it private again. Shared lineups also appear on your public profile.",
        },
        {
          title: "Scores and tiers",
          body: "Rank comes from artist skills, not base stats. The formula, per-category weights, and tier thresholds live on the Info rank page.",
        },
      ],
    },
    privacy: {
      title: "Privacy",
      intro: "A summary of the data TopGirl processes and how you control it.",
      sections: [
        {
          title: "Data we store",
          body: "When you sign in with Google or Discord we store your email, display name, and avatar URL from the provider. You may add an in-game nickname and ID/server on the Profile page.",
        },
        {
          title: "Data you create",
          body: "Artist collections and lineups (including lineup names) are stored in Supabase. Private lineups can only be opened by their owner.",
        },
        {
          title: "What is public",
          body: "Only lineups you share are reachable by link, and they appear on your public profile together with your name, nickname, server, and shared lineups.",
        },
        {
          title: "Cookies",
          body: "Cookies are used only for the login session (Supabase Auth). There are no advertising cookies or third-party trackers; Vercel analytics runs without cookies.",
        },
        {
          title: "Deleting data",
          body: "You can sign out at any time from the Profile page. To delete your account and its data, contact the site owner through the repository's Discord/GitHub channel.",
        },
      ],
    },
    legal: {
      title: "Legal",
      intro: "Terms for using the TopGirl Team Builder.",
      sections: [
        {
          title: "Not an official affiliation",
          body: "TopGirl is a fan project and is not affiliated with the game's developer or publisher. All artist names, skills, and game terms belong to their respective rights holders.",
        },
        {
          title: "Data accuracy",
          body: "Stats and seasons are collected manually and may differ from the latest game version. Treat them as estimates, not an official reference.",
        },
        {
          title: "User content",
          body: "You are responsible for the lineup names and profile data you submit. Do not upload content that breaks the law or the rights of others.",
        },
        {
          title: "No warranty",
          body: "The service is provided as is, without warranty of availability or freedom from errors. Features may change or be discontinued at any time.",
        },
        {
          title: "Changes to these terms",
          body: "These terms may be updated. The latest version is always available on this page.",
        },
      ],
    },
  },
  fr: {
    help: {
      title: "Aide",
      intro: "Guide rapide du TopGirl Team Builder.",
      sections: [
        {
          title: "Choisir la saison du serveur",
          body: "Les puces de saison au-dessus de la liste fixent l'artiste le plus récent que vous pouvez obtenir. Les artistes au-dessus de votre saison apparaissent dans Pas encore disponible et restent sélectionnables, avec un avertissement.",
        },
        {
          title: "Composer une équipe",
          body: "Ouvrez l'onglet Team Builder, cliquez sur un emplacement puis choisissez un artiste. Composer la meilleure équipe remplit les 5 emplacements avec la meilleure combinaison disponible ; le bonus de genre départage les égalités.",
        },
        {
          title: "Collection",
          body: "Connectez-vous avec Google ou Discord, puis marquez les artistes que vous possédez. La collection est liée à votre compte et sert aux filtres.",
        },
        {
          title: "Compositions et liens",
          body: "Enregistrez une équipe comme composition dans l'onglet Lineup. Partagez-la via un lien non listé ; révoquer le lien la rend privée. Les compositions partagées apparaissent aussi sur votre profil public.",
        },
        {
          title: "Scores et tiers",
          body: "Le rang dépend des compétences, pas des stats de base. Formule, poids par catégorie et seuils de tier sont sur la page Info rank.",
        },
      ],
    },
    privacy: {
      title: "Confidentialité",
      intro: "Résumé des données traitées par TopGirl et de leur contrôle.",
      sections: [
        {
          title: "Données stockées",
          body: "À la connexion via Google ou Discord, nous stockons l'e-mail, le nom affiché et l'URL d'avatar fournis. Vous pouvez ajouter un pseudo et un ID/serveur en jeu depuis la page Profil.",
        },
        {
          title: "Données que vous créez",
          body: "Les collections et compositions (y compris leurs noms) sont stockées dans Supabase. Une composition privée n'est accessible qu'à son propriétaire.",
        },
        {
          title: "Ce qui est public",
          body: "Seules les compositions partagées sont accessibles par lien et apparaissent sur votre profil public avec votre nom, pseudo, serveur et compositions partagées.",
        },
        {
          title: "Cookies",
          body: "Les cookies servent uniquement à la session de connexion (Supabase Auth). Aucun cookie publicitaire ni traceur tiers ; l'analytique Vercel fonctionne sans cookie.",
        },
        {
          title: "Suppression des données",
          body: "Vous pouvez vous déconnecter à tout moment depuis la page Profil. Pour supprimer le compte et ses données, contactez le propriétaire du site via le canal Discord/GitHub du dépôt.",
        },
      ],
    },
    legal: {
      title: "Mentions légales",
      intro: "Conditions d'utilisation du TopGirl Team Builder.",
      sections: [
        {
          title: "Aucune affiliation officielle",
          body: "TopGirl est un projet de fans, sans affiliation avec le développeur ou l'éditeur du jeu. Les noms d'artistes, compétences et termes du jeu appartiennent à leurs détenteurs.",
        },
        {
          title: "Exactitude des données",
          body: "Les stats et saisons sont collectées manuellement et peuvent différer de la dernière version du jeu. À utiliser comme estimation, pas comme référence officielle.",
        },
        {
          title: "Contenu utilisateur",
          body: "Vous êtes responsable des noms de compositions et des données de profil saisies. N'envoyez pas de contenu illégal ou portant atteinte aux droits d'autrui.",
        },
        {
          title: "Sans garantie",
          body: "Le service est fourni en l'état, sans garantie de disponibilité ni d'absence d'erreur. Les fonctionnalités peuvent changer ou être arrêtées à tout moment.",
        },
        {
          title: "Modification des conditions",
          body: "Ces conditions peuvent être mises à jour. La dernière version est toujours disponible sur cette page.",
        },
      ],
    },
  },
  ko: {
    help: {
      title: "도움말",
      intro: "TopGirl 팀 빌더 사용 안내.",
      sections: [
        {
          title: "서버 시즌 선택",
          body: "아티스트 목록 위의 시즌 칩이 획득할 수 있는 최신 아티스트의 상한입니다. 서버 시즌보다 높은 아티스트는 '아직 획득 불가'에 표시되고 경고와 함께 선택할 수는 있습니다.",
        },
        {
          title: "팀 구성",
          body: "Team Builder 탭에서 슬롯을 누르고 아티스트를 고르세요. 최고 팀 구성 버튼은 획득 가능한 조합 중 최고 점수로 5개 슬롯을 채우고, 동점은 장르 보너스로 가릅니다.",
        },
        {
          title: "컬렉션",
          body: "Google 또는 Discord로 로그인한 뒤 보유한 아티스트를 표시하세요. 컬렉션은 계정에 저장되고 필터에 사용됩니다.",
        },
        {
          title: "라인업과 링크",
          body: "Lineup 탭에서 팀을 라인업으로 저장하세요. 비공개 링크로 공유하고 링크를 취소하면 다시 비공개가 됩니다. 공유한 라인업은 공개 프로필에도 표시됩니다.",
        },
        {
          title: "점수와 티어",
          body: "순위는 기본 스탯이 아니라 스킬로 계산합니다. 공식, 카테고리별 가중치, 티어 기준은 Info rank 페이지에 있습니다.",
        },
      ],
    },
    privacy: {
      title: "개인정보",
      intro: "TopGirl이 처리하는 데이터와 관리 방법을 요약합니다.",
      sections: [
        {
          title: "저장하는 데이터",
          body: "Google 또는 Discord 로그인 시 제공자로부터 이메일, 표시 이름, 아바타 URL을 저장합니다. 프로필 페이지에서 게임 닉네임과 ID/서버를 추가할 수 있습니다.",
        },
        {
          title: "사용자가 만든 데이터",
          body: "아티스트 컬렉션과 라인업(이름 포함)은 Supabase에 저장됩니다. 비공개 라인업은 소유자만 열 수 있습니다.",
        },
        {
          title: "공개되는 정보",
          body: "공유한 라인업만 링크로 열 수 있으며, 이름·닉네임·서버·공유 라인업과 함께 공개 프로필에 표시됩니다.",
        },
        {
          title: "쿠키",
          body: "쿠키는 로그인 세션(Supabase Auth)에만 사용됩니다. 광고 쿠키나 제3자 추적기는 없으며 Vercel 분석은 쿠키 없이 동작합니다.",
        },
        {
          title: "데이터 삭제",
          body: "프로필 페이지에서 언제든 로그아웃할 수 있습니다. 계정과 데이터 삭제는 저장소의 Discord/GitHub 채널로 사이트 소유자에게 요청하세요.",
        },
      ],
    },
    legal: {
      title: "법적 고지",
      intro: "TopGirl 팀 빌더 이용 약관.",
      sections: [
        {
          title: "공식 제휴 아님",
          body: "TopGirl은 팬 프로젝트이며 게임 개발사·퍼블리셔와 제휴하지 않습니다. 모든 아티스트 이름, 스킬, 게임 용어는 해당 권리자에게 있습니다.",
        },
        {
          title: "데이터 정확성",
          body: "스탯과 시즌은 수동으로 수집하며 최신 게임 버전과 다를 수 있습니다. 공식 기준이 아닌 참고용으로 사용하세요.",
        },
        {
          title: "사용자 콘텐츠",
          body: "입력한 라인업 이름과 프로필 데이터에 대한 책임은 사용자에게 있습니다. 불법이거나 타인의 권리를 침해하는 콘텐츠를 올리지 마세요.",
        },
        {
          title: "보증 없음",
          body: "서비스는 있는 그대로 제공되며 가용성이나 오류 없음을 보증하지 않습니다. 기능은 언제든 변경되거나 중단될 수 있습니다.",
        },
        {
          title: "약관 변경",
          body: "약관은 변경될 수 있습니다. 최신 버전은 항상 이 페이지에 있습니다.",
        },
      ],
    },
  },
};
