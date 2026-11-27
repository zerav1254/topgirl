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
          body: "Buka tab Team Builder, klik slot, lalu pilih artist. Tombol Susun tim terbaik mengisi {size} slot dari kombinasi skor tertinggi yang bisa diperoleh; bonus genre dipakai untuk memecah seri.",
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
          body: "Rank dihitung dari skill artist dan stat panggung (Sing/Dance level maks). Rumus, bobot, dan ambang tier ada di halaman Info rank.",
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
          body: "Kamu bisa keluar kapan saja dari halaman Profil. Untuk penghapusan akun beserta datanya, hubungi pemilik situs lewat email support@zerav.web.id atau kanal Discord/GitHub repositori.",
        },
      ],
    },
    legal: {
      title: "Legal",
      intro: "Ketentuan pemakaian TopGirl Team Builder.",
      sections: [
        {
          title: "Bukan afiliasi resmi",
          body: "TopGirl Team Builder adalah situs penggemar tidak resmi dan tidak berafiliasi dengan A3Games selaku pengembang dan penerbit game TopGirl (Apex Girl). Semua nama artist, skill, dan istilah game milik pemegang haknya.",
        },
        {
          title: "Aset dan hak cipta",
          body: "Ikon genre, logo, potret artist, dan aset visual lain dari game TopGirl (Apex Girl) adalah milik A3Games serta pemegang haknya. Aset ditampilkan terbatas untuk mengenali artist serta memberi informasi kepada pemain; situs ini tidak mengklaim kepemilikan atas aset tersebut dan tidak disponsori atau diendorse oleh pemegang hak. Pemegang hak yang keberatan atas penggunaan aset tertentu dapat menghubungi kami lewat email support@zerav.web.id atau kanal Discord/GitHub repositori, dan aset akan kami tinjau atau hapus.",
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
          body: "Open the Team Builder tab, click a slot, then pick an artist. Build the best team fills all {size} slots with the highest-scoring obtainable combination; genre bonus breaks ties.",
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
          body: "Rank comes from artist skills and stage stats (max-level Sing/Dance). The formula, weights, and tier thresholds live on the Info rank page.",
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
          body: "You can sign out at any time from the Profile page. To delete your account and its data, contact the site owner by email at support@zerav.web.id or through the repository's Discord/GitHub channel.",
        },
      ],
    },
    legal: {
      title: "Legal",
      intro: "Terms for using the TopGirl Team Builder.",
      sections: [
        {
          title: "Not an official affiliation",
          body: "TopGirl Team Builder is an unofficial fan site and is not affiliated with A3Games, the developer and publisher of the game TopGirl (Apex Girl). All artist names, skills, and game terms belong to their respective rights holders.",
        },
        {
          title: "Assets and copyright",
          body: "Genre icons, the logo, artist portraits, and other visual assets from the game TopGirl (Apex Girl) belong to A3Games and its rights holders. They are shown only to identify artists and inform players; this site claims no ownership over them and is not sponsored or endorsed by the rights holders. Rights holders who object to the use of a specific asset can contact us by email at support@zerav.web.id or through the repository's Discord/GitHub channel and we will review or remove it.",
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
          body: "Ouvrez l'onglet Team Builder, cliquez sur un emplacement puis choisissez un artiste. Composer la meilleure équipe remplit les {size} emplacements avec la meilleure combinaison disponible ; le bonus de genre départage les égalités.",
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
          body: "Le rang dépend des compétences et des stats de scène (Sing/Dance au niveau max). Formule, poids et seuils de tier sont sur la page Info rank.",
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
          body: "Vous pouvez vous déconnecter à tout moment depuis la page Profil. Pour supprimer le compte et ses données, contactez le propriétaire du site par e-mail à support@zerav.web.id ou via le canal Discord/GitHub du dépôt.",
        },
      ],
    },
    legal: {
      title: "Mentions légales",
      intro: "Conditions d'utilisation du TopGirl Team Builder.",
      sections: [
        {
          title: "Aucune affiliation officielle",
          body: "TopGirl Team Builder est un site de fans non officiel, sans affiliation avec A3Games, développeur et éditeur du jeu TopGirl (Apex Girl). Les noms d'artistes, compétences et termes du jeu appartiennent à leurs détenteurs.",
        },
        {
          title: "Ressources et droits d'auteur",
          body: "Les icônes de genre, le logo, les portraits d'artistes et les autres ressources visuelles du jeu TopGirl (Apex Girl) appartiennent à A3Games et aux détenteurs des droits. Elles sont affichées uniquement pour identifier les artistes et informer les joueurs ; ce site ne revendique aucune propriété sur ces ressources et n'est ni sponsorisé ni approuvé par les détenteurs des droits. Les détenteurs de droits qui s'opposent à l'utilisation d'une ressource précise peuvent nous contacter par e-mail à support@zerav.web.id ou via le canal Discord/GitHub du dépôt ; nous examinerons ou retirerons la ressource.",
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
          body: "Team Builder 탭에서 슬롯을 누르고 아티스트를 고르세요. 최고 팀 구성 버튼은 획득 가능한 조합 중 최고 점수로 {size}개 슬롯을 채우고, 동점은 장르 보너스로 가릅니다.",
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
          body: "순위는 스킬과 무대 스탯(최대 레벨 Sing/Dance)으로 계산합니다. 공식, 가중치, 티어 기준은 Info rank 페이지에 있습니다.",
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
          body: "프로필 페이지에서 언제든 로그아웃할 수 있습니다. 계정과 데이터 삭제는 이메일 support@zerav.web.id 또는 저장소의 Discord/GitHub 채널로 사이트 소유자에게 요청하세요.",
        },
      ],
    },
    legal: {
      title: "법적 고지",
      intro: "TopGirl 팀 빌더 이용 약관.",
      sections: [
        {
          title: "공식 제휴 아님",
          body: "TopGirl Team Builder는 비공식 팬 사이트이며 게임 TopGirl(Apex Girl)의 개발사·퍼블리셔인 A3Games와 제휴하지 않습니다. 모든 아티스트 이름, 스킬, 게임 용어는 해당 권리자에게 있습니다.",
        },
        {
          title: "에셋 및 저작권",
          body: "장르 아이콘, 로고, 아티스트 초상, 기타 시각 에셋은 게임 TopGirl(Apex Girl)의 A3Games 및 권리자에게 있습니다. 이 에셋은 아티스트를 식별하고 플레이어에게 정보를 제공하기 위한 목적으로만 표시되며, 본 사이트는 이에 대한 소유권을 주장하지 않고 권리자의 후원이나 승인을 받지 않았습니다. 특정 에셋의 사용에 이의가 있는 권리자는 이메일 support@zerav.web.id 또는 저장소의 Discord/GitHub 채널로 연락해 주시면 검토 후 삭제하겠습니다.",
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
  zh: {
    help: {
      title: "帮助",
      intro: "TopGirl Team Builder 快速指南。",
      sections: [
        {
          title: "选择服务器赛季",
          body: "艺术家列表上方的赛季标签决定你能获得的最新艺术家。高于所在服务器赛季的艺术家仍会显示在“暂不可获得”中，也可以选择，但会给出提示。",
        },
        {
          title: "组建队伍",
          body: "打开 Team Builder 标签，点击槽位，然后选择艺术家。最佳队伍按钮会用可获得的最高分组合填满 {size} 个槽位；同分时由类型加成决定。",
        },
        {
          title: "收藏",
          body: "使用 Google 或 Discord 登录，然后标记你已拥有的艺术家。收藏保存在你的账户中，并用于筛选。",
        },
        {
          title: "Lineup 与链接",
          body: "在 Lineup 标签把队伍保存为 lineup。通过不公开链接分享；撤销链接后重新变为私密。已分享的 lineup 也会显示在你的公开主页上。",
        },
        {
          title: "分数与 Tier",
          body: "排名依据艺人技能与舞台属性（满级 Sing/Dance）。公式、权重与 Tier 门槛见 Info rank 页面。",
        },
      ],
    },
    privacy: {
      title: "隐私",
      intro: "TopGirl 处理的数据以及你如何掌控这些数据的概要。",
      sections: [
        {
          title: "我们存储的数据",
          body: "使用 Google 或 Discord 登录时，我们会存储服务商提供的电子邮箱、显示名称和头像 URL。你可以在个人资料页面添加游戏昵称和 ID/服务器。",
        },
        {
          title: "你创建的数据",
          body: "艺术家收藏和 lineup（包括 lineup 名称）存储在 Supabase 中。私密 lineup 只有所有者可以打开。",
        },
        {
          title: "公开的内容",
          body: "只有你分享的 lineup 可以通过链接访问，并与你的名称、昵称、服务器和已分享的 lineup 一起显示在公开主页上。",
        },
        {
          title: "Cookie",
          body: "Cookie 仅用于登录会话（Supabase Auth）。没有广告 Cookie 或第三方追踪器；Vercel 分析不使用 Cookie。",
        },
        {
          title: "删除数据",
          body: "你可以随时在个人资料页面退出登录。如需删除账户及其数据，请通过电子邮件 support@zerav.web.id 或仓库的 Discord/GitHub 渠道联系站点所有者。",
        },
      ],
    },
    legal: {
      title: "法律声明",
      intro: "使用 TopGirl Team Builder 的条款。",
      sections: [
        {
          title: "非官方关联",
          body: "TopGirl Team Builder 是非官方粉丝站点，与游戏 TopGirl（Apex Girl）的开发商兼发行商 A3Games 没有关联。所有艺术家名称、技能和游戏术语归各自权利人所有。",
        },
        {
          title: "素材与版权",
          body: "类型图标、标志、艺人肖像及其他视觉素材来自游戏 TopGirl（Apex Girl），归 A3Games 及其权利人所有。这些素材仅用于识别艺人并向玩家提供信息，本站不主张对其拥有所有权，也未获得权利人的赞助或认可。如权利人反对使用特定素材，可通过电子邮件 support@zerav.web.id 或仓库的 Discord/GitHub 渠道联系我们，我们会审核并删除。",
        },
        {
          title: "数据准确性",
          body: "属性和赛季为手动收集，可能与最新游戏版本不同。请作为参考而非官方依据。",
        },
        {
          title: "用户内容",
          body: "你对自己提交的 lineup 名称和个人资料数据负责。请勿上传违法或侵犯他人权利的内容。",
        },
        {
          title: "不提供保证",
          body: "服务按现状提供，不保证可用性或不出现错误。功能可能随时变更或停止。",
        },
        {
          title: "条款变更",
          body: "这些条款可能更新。最新版本始终在本页面提供。",
        },
      ],
    },
  },
  ja: {
    help: {
      title: "ヘルプ",
      intro: "TopGirl Team Builder の簡単なガイド。",
      sections: [
        {
          title: "サーバーシーズンを選ぶ",
          body: "アーティスト一覧の上のシーズンチップが、入手できる最新アーティストの上限になります。サーバーシーズンより上のアーティストは「まだ入手不可」に表示されますが、警告付きで選択できます。",
        },
        {
          title: "チームを組む",
          body: "Team Builder タブを開き、スロットをクリックしてアーティストを選びます。最適チーム編成ボタンは入手可能な中で最高スコアの組み合わせで {size} スロットを埋め、同点はジャンルボーナスで決めます。",
        },
        {
          title: "コレクション",
          body: "Google または Discord でログインし、所持しているアーティストに印を付けます。コレクションはアカウントに保存され、絞り込みに使われます。",
        },
        {
          title: "Lineup とリンク",
          body: "Lineup タブでチームを lineup として保存します。非公開リンクで共有でき、リンクを取り消すと再び非公開になります。共有した lineup は公開プロフィールにも表示されます。",
        },
        {
          title: "スコアと Tier",
          body: "順位はスキルとステージ能力（最大レベルの Sing/Dance）から算出します。計算式、重み、Tier のしきい値は Info rank ページにあります。",
        },
      ],
    },
    privacy: {
      title: "プライバシー",
      intro: "TopGirl が扱うデータと、その管理方法の概要。",
      sections: [
        {
          title: "保存するデータ",
          body: "Google または Discord でログインすると、プロバイダーから提供されたメールアドレス、表示名、アバター URL を保存します。プロフィールページでゲーム内ニックネームと ID/サーバーを追加できます。",
        },
        {
          title: "あなたが作成するデータ",
          body: "アーティストのコレクションと lineup（lineup 名を含む）は Supabase に保存されます。非公開の lineup は所有者だけが開けます。",
        },
        {
          title: "公開される情報",
          body: "共有した lineup だけがリンクで開け、名前・ニックネーム・サーバー・共有した lineup とともに公開プロフィールに表示されます。",
        },
        {
          title: "Cookie",
          body: "Cookie はログインセッション（Supabase Auth）にのみ使います。広告 Cookie や第三者トラッカーはなく、Vercel の分析は Cookie なしで動作します。",
        },
        {
          title: "データの削除",
          body: "プロフィールページからいつでもログアウトできます。アカウントとデータの削除は、メール（support@zerav.web.id）またはリポジトリの Discord/GitHub チャンネルからサイト所有者に連絡してください。",
        },
      ],
    },
    legal: {
      title: "法的表示",
      intro: "TopGirl Team Builder の利用規約。",
      sections: [
        {
          title: "公式な提携ではありません",
          body: "TopGirl Team Builder は非公式のファンサイトであり、ゲーム「TopGirl（Apex Girl）」の開発元・販売元である A3Games と提携していません。アーティスト名、スキル、ゲーム用語はすべて各権利者に帰属します。",
        },
        {
          title: "素材と著作権",
          body: "ジャンルのアイコン、ロゴ、アーティストの肖像、その他のビジュアル素材は、ゲーム「TopGirl（Apex Girl）」の A3Games および各権利者に帰属します。これらはアーティストの識別とプレイヤーへの情報提供のみを目的として表示しており、本サイトはその所有権を主張せず、権利者によるスポンサーや承認も受けていません。特定の素材の使用に異議がある権利者の方は、メール（support@zerav.web.id）またはリポジトリの Discord/GitHub チャンネルからご連絡ください。確認のうえ削除します。",
        },
        {
          title: "データの正確性",
          body: "ステータスとシーズンは手作業で収集しており、最新のゲームバージョンと異なる場合があります。公式な基準ではなく目安としてご利用ください。",
        },
        {
          title: "ユーザーコンテンツ",
          body: "入力した lineup 名とプロフィールデータについてはあなたが責任を負います。違法な内容や他者の権利を侵害する内容をアップロードしないでください。",
        },
        {
          title: "保証なし",
          body: "本サービスは現状のまま提供され、可用性やエラーの不存在を保証しません。機能はいつでも変更または終了される場合があります。",
        },
        {
          title: "規約の変更",
          body: "本規約は更新される場合があります。最新版は常にこのページにあります。",
        },
      ],
    },
  },
  de: {
    help: {
      title: "Hilfe",
      intro: "Kurzanleitung für den TopGirl Team Builder.",
      sections: [
        {
          title: "Server-Saison wählen",
          body: "Die Saison-Chips über der Artist-Liste legen den neuesten Artist fest, den du erhalten kannst. Artists über deiner Server-Saison erscheinen weiterhin unter Noch nicht erhältlich und lassen sich mit Hinweis trotzdem wählen.",
        },
        {
          title: "Team zusammenstellen",
          body: "Öffne den Tab Team Builder, klicke auf einen Slot und wähle einen Artist. Bestes Team bilden füllt alle {size} Slots mit der punktbesten erhältlichen Kombination; bei Gleichstand entscheidet der Genre-Bonus.",
        },
        {
          title: "Sammlung",
          body: "Melde dich mit Google oder Discord an und markiere die Artists, die du besitzt. Deine Sammlung wird im Konto gespeichert und für Filter verwendet.",
        },
        {
          title: "Lineups und Links",
          body: "Speichere ein Team im Tab Lineup als Lineup. Teile es über einen nicht gelisteten Link; nach Widerruf des Links ist es wieder privat. Geteilte Lineups erscheinen auch auf deinem öffentlichen Profil.",
        },
        {
          title: "Punkte und Tier",
          body: "Das Ranking basiert auf Artist-Skills und Bühnenwerten (Sing/Dance auf Maximallevel). Formel, Gewichte und Tier-Schwellen stehen auf der Seite Info rank.",
        },
      ],
    },
    privacy: {
      title: "Datenschutz",
      intro: "Zusammenfassung der Daten, die TopGirl verarbeitet, und wie du sie kontrollierst.",
      sections: [
        {
          title: "Gespeicherte Daten",
          body: "Bei der Anmeldung mit Google oder Discord speichern wir E-Mail, Anzeigename und Avatar-URL des Anbieters. Auf der Profilseite kannst du einen Ingame-Nicknamen sowie ID/Server ergänzen.",
        },
        {
          title: "Von dir erstellte Daten",
          body: "Artist-Sammlungen und Lineups (inklusive Lineup-Namen) werden in Supabase gespeichert. Private Lineups kann nur der Eigentümer öffnen.",
        },
        {
          title: "Was öffentlich ist",
          body: "Nur geteilte Lineups sind per Link erreichbar und erscheinen zusammen mit Name, Nickname, Server und geteilten Lineups auf deinem öffentlichen Profil.",
        },
        {
          title: "Cookies",
          body: "Cookies werden nur für die Anmeldesitzung (Supabase Auth) verwendet. Es gibt keine Werbe-Cookies oder Drittanbieter-Tracker; Vercel Analytics läuft ohne Cookies.",
        },
        {
          title: "Daten löschen",
          body: "Du kannst dich jederzeit auf der Profilseite abmelden. Für die Löschung von Konto und Daten wende dich per E-Mail an support@zerav.web.id oder über den Discord/GitHub-Kanal des Repositories an den Seiteninhaber.",
        },
      ],
    },
    legal: {
      title: "Rechtliches",
      intro: "Bedingungen für die Nutzung des TopGirl Team Builder.",
      sections: [
        {
          title: "Keine offizielle Verbindung",
          body: "TopGirl Team Builder ist eine inoffizielle Fanseite und steht in keiner Verbindung zu A3Games, dem Entwickler und Publisher des Spiels TopGirl (Apex Girl). Alle Artist-Namen, Skills und Spielbegriffe gehören ihren jeweiligen Rechteinhabern.",
        },
        {
          title: "Assets und Urheberrecht",
          body: "Genre-Symbole, das Logo, Artist-Porträts und andere visuelle Assets aus dem Spiel TopGirl (Apex Girl) gehören A3Games sowie den jeweiligen Rechteinhabern. Sie werden nur zur Identifikation der Artists und zur Information der Spieler angezeigt; diese Seite erhebt keinen Anspruch auf deren Eigentum und wird von den Rechteinhabern weder gesponsert noch unterstützt. Rechteinhaber, die der Verwendung eines bestimmten Assets widersprechen, können uns per E-Mail an support@zerav.web.id oder über den Discord/GitHub-Kanal des Repositories kontaktieren; wir prüfen und entfernen es.",
        },
        {
          title: "Genauigkeit der Daten",
          body: "Werte und Saisons werden manuell erfasst und können von der aktuellen Spielversion abweichen. Sie dienen als Schätzung, nicht als offizielle Referenz.",
        },
        {
          title: "Nutzerinhalte",
          body: "Du bist für die von dir eingegebenen Lineup-Namen und Profildaten verantwortlich. Lade keine Inhalte hoch, die gegen Gesetze oder Rechte Dritter verstoßen.",
        },
        {
          title: "Keine Gewährleistung",
          body: "Der Dienst wird wie besehen bereitgestellt, ohne Gewähr für Verfügbarkeit oder Fehlerfreiheit. Funktionen können jederzeit geändert oder eingestellt werden.",
        },
        {
          title: "Änderungen dieser Bedingungen",
          body: "Diese Bedingungen können aktualisiert werden. Die aktuelle Fassung ist stets auf dieser Seite verfügbar.",
        },
      ],
    },
  },
};
