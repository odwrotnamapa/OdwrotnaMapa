(function () {
  "use strict";

  // Publiczne komentarze do miejsc (Nostr, kind 1956) - wiele
  // komentarzy na miejsce, kazdy osobne, trwale zdarzenie. Wspiera
  // odpowiedzi (zagniezdzone, przez tag "e" wskazujacy rodzica) i
  // reakcje lubie/nie lubie (kind 31557, zastepowalne per komentarz
  // per uzytkownik). Ten sam wzorzec co ratings-service.js: brak
  // wlasnego stanu, wszystko wstrzykiwane przez configure().

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function shortenPubkey(pubkey) {
    return pubkey ? `${pubkey.slice(0, 8)}…` : "";
  }

  function formatCommentDate(createdAt) {
    try {
      return new Date(createdAt * 1000).toLocaleDateString(
        ctx.state.language === "en" ? "en-GB" : "pl-PL",
        { day: "numeric", month: "short", year: "numeric" }
      );
    } catch (_) {
      return "";
    }
  }

  // Buduje drzewo z plaskiej listy komentarzy - komentarze najwyzszego
  // poziomu (parentId === null) plus ich bezposrednie odpowiedzi.
  // Celowo tylko JEDEN poziom zagniezdzenia (odpowiedz na odpowiedz
  // trafia do tego samego "kubelka" co jej rodzic-najwyzszego-poziomu)
  // - glebsze zagniezdzanie szybko robi sie nieczytelne w waskim
  // panelu bocznym.
  function buildCommentTree(comments) {
    const byId = new Map(comments.map(c => [c.id, c]));
    const topLevel = [];
    const repliesByParent = new Map();

    for (const comment of comments) {
      let rootParentId = comment.parentId;
      if (rootParentId && byId.has(rootParentId)) {
        const parent = byId.get(rootParentId);
        if (parent.parentId) rootParentId = parent.parentId;
      }

      if (!rootParentId || !byId.has(rootParentId)) {
        topLevel.push(comment);
      } else {
        if (!repliesByParent.has(rootParentId)) repliesByParent.set(rootParentId, []);
        repliesByParent.get(rootParentId).push(comment);
      }
    }

    for (const replies of repliesByParent.values()) {
      replies.sort((a, b) => a.createdAt - b.createdAt);
    }

    return { topLevel, repliesByParent };
  }

  function createCommentSection(placeKey, placeMeta) {
    const t = ctx.text[ctx.state.language];

    const section = document.createElement("section");
    section.className = "place-comments";

    const heading = document.createElement("p");
    heading.className = "place-comments-heading";
    heading.textContent = t.commentsHeading;

    const spinner = document.createElement("span");
    spinner.className = "place-inline-spinner";
    spinner.setAttribute("aria-hidden", "true");
    spinner.textContent = "⏳";
    spinner.hidden = false;
    heading.appendChild(spinner);

    const list = document.createElement("div");
    list.className = "place-comments-list";

    const status = document.createElement("p");
    status.className = "place-comments-status";
    status.textContent = t.commentsLoading;

    const form = document.createElement("div");
    form.className = "place-comments-form";

    const textarea = document.createElement("textarea");
    textarea.className = "place-comments-input";
    textarea.placeholder = t.commentsPlaceholder;
    textarea.maxLength = 500;
    textarea.rows = 2;

    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.className = "place-comments-submit";
    submitButton.textContent = t.commentsSubmit;

    form.append(textarea, submitButton);
    section.append(heading, status, list, form);

    const ui = { section, list, status, spinner, textarea, submitButton, placeKey, placeMeta };

    submitButton.addEventListener("click", () => {
      submitPlaceComment(placeKey, placeMeta, textarea.value, ui, null);
    });

    // NAPRAWA (2026-08-14): jeśli wczytanie komentarzy się nie
    // powiodło (np. chwilowy problem z siecią/CDN przy starcie
    // strony), do tej pory jedynym sposobem ponowienia było zamknięcie
    // i ponowne otwarcie panelu miejsca. Klik w komunikat błędu teraz
    // od razu próbuje jeszcze raz.
    status.addEventListener("click", () => {
      const currentText = ctx.text[ctx.state.language];
      if (status.textContent !== currentText.commentsError) return;
      loadPlaceCommentsForPlace(placeKey, ui);
    });

    return ui;
  }

  function createReactionRow(comment, myPubKeyHex, reactionData, ui) {
    const t = ctx.text[ctx.state.language];
    const row = document.createElement("div");
    row.className = "place-comment-reactions";

    const likeButton = document.createElement("button");
    likeButton.type = "button";
    likeButton.className = "place-comment-reaction place-comment-reaction-like";
    likeButton.textContent = `👍 ${reactionData?.likes || 0}`;
    likeButton.classList.toggle("is-active", reactionData?.myReaction === "like");

    const dislikeButton = document.createElement("button");
    dislikeButton.type = "button";
    dislikeButton.className = "place-comment-reaction place-comment-reaction-dislike";
    dislikeButton.textContent = `👎 ${reactionData?.dislikes || 0}`;
    dislikeButton.classList.toggle("is-active", reactionData?.myReaction === "dislike");

    const replyButton = document.createElement("button");
    replyButton.type = "button";
    replyButton.className = "place-comment-reaction place-comment-reply-toggle";
    replyButton.textContent = t.commentReply;

    const reactionSpinner = document.createElement("span");
    reactionSpinner.className = "place-inline-spinner";
    reactionSpinner.setAttribute("aria-hidden", "true");
    reactionSpinner.textContent = "⏳";
    reactionSpinner.hidden = true;

    likeButton.addEventListener("click", () => {
      const next = reactionData?.myReaction === "like" ? "" : "like";
      likeButton.disabled = true;
      dislikeButton.disabled = true;
      reactionSpinner.hidden = false;
      submitCommentReaction(comment.id, next, ui, { likeButton, dislikeButton, reactionSpinner });
    });
    dislikeButton.addEventListener("click", () => {
      const next = reactionData?.myReaction === "dislike" ? "" : "dislike";
      likeButton.disabled = true;
      dislikeButton.disabled = true;
      reactionSpinner.hidden = false;
      submitCommentReaction(comment.id, next, ui, { likeButton, dislikeButton, reactionSpinner });
    });

    row.append(likeButton, dislikeButton, reactionSpinner, replyButton);
    return { row, replyButton };
  }

  function createReplyForm(comment, ui) {
    const t = ctx.text[ctx.state.language];
    const form = document.createElement("div");
    form.className = "place-comments-form place-comment-reply-form";
    form.hidden = true;

    const textarea = document.createElement("textarea");
    textarea.className = "place-comments-input";
    textarea.placeholder = t.commentsPlaceholder;
    textarea.maxLength = 500;
    textarea.rows = 2;

    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.className = "place-comments-submit";
    submitButton.textContent = t.commentsSubmit;

    submitButton.addEventListener("click", () => {
      submitPlaceComment(ui.placeKey, ui.placeMeta, textarea.value, ui, comment.id);
    });

    form.append(textarea, submitButton);
    return form;
  }

  function createEditForm(comment, ui, textElement, replies) {
    const t = ctx.text[ctx.state.language];
    const form = document.createElement("div");
    form.className = "place-comments-form place-comment-edit-form";
    form.hidden = true;

    const textarea = document.createElement("textarea");
    textarea.className = "place-comments-input";
    textarea.maxLength = 500;
    textarea.rows = 2;
    textarea.value = comment.text;

    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.className = "place-comments-submit";
    submitButton.textContent = t.commentsSubmit;

    submitButton.addEventListener("click", () => {
      editPlaceComment(comment, textarea.value, ui, form, textElement, replies);
    });

    form.append(textarea, submitButton);
    return form;
  }

  function renderCommentItem(comment, myPubKeyHex, profileNames, reactions, ui, isReply, replies, ratingsByAuthor) {
    const t = ctx.text[ctx.state.language];
    const item = document.createElement("div");
    item.className = isReply ? "place-comment-item place-comment-reply" : "place-comment-item";

    const meta = document.createElement("div");
    meta.className = "place-comment-meta";

    const profile = profileNames?.[comment.pubkey];
    const displayName = profile?.name;

    if (profile?.avatar) {
      const avatarImg = document.createElement("img");
      avatarImg.className = "place-comment-avatar";
      avatarImg.src = profile.avatar;
      avatarImg.alt = "";
      avatarImg.loading = "lazy";
      avatarImg.addEventListener("error", () => avatarImg.remove());
      meta.appendChild(avatarImg);
    }

    const author = document.createElement("span");
    author.className = "place-comment-author";
    author.textContent = displayName
      ? `${displayName} · ${shortenPubkey(comment.pubkey)}`
      : shortenPubkey(comment.pubkey);

    meta.appendChild(author);

    // Jesli autor tego komentarza TEZ ocenil to miejsce - pokazujemy
    // jego wlasna ocene tuz przy nazwie, zeby bylo widac obie opinie
    // naraz (ocena + komentarz), bez przescrollowywania do osobnej
    // sekcji ocen wyzej na karcie.
    const authorRating = ratingsByAuthor?.[comment.pubkey];
    if (Number.isFinite(authorRating)) {
      const ratingBadge = document.createElement("span");
      ratingBadge.className = "place-comment-author-rating";
      ratingBadge.title = t.commentAuthorRating?.replace("{rating}", authorRating) || `${authorRating}/5`;
      ratingBadge.textContent = "★".repeat(Math.round(authorRating)) + "☆".repeat(5 - Math.round(authorRating));
      meta.appendChild(ratingBadge);
    }

    const date = document.createElement("span");
    date.className = "place-comment-date";
    date.textContent = formatCommentDate(comment.createdAt);

    meta.appendChild(date);

    const text = document.createElement("p");
    text.className = "place-comment-text";
    text.textContent = comment.text;

    item.append(meta, text);

    if (myPubKeyHex && comment.pubkey === myPubKeyHex) {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "place-comment-edit";
      editButton.textContent = "✎";
      editButton.title = t.commentEdit;
      editButton.setAttribute("aria-label", t.commentEdit);

      const editForm = createEditForm(comment, ui, text, replies || []);
      editButton.addEventListener("click", () => {
        editForm.hidden = !editForm.hidden;
        text.hidden = !editForm.hidden;
      });
      meta.appendChild(editButton);
      item.appendChild(editForm);

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "place-comment-delete";
      deleteButton.textContent = "🗑";
      deleteButton.title = t.commentDelete;
      deleteButton.setAttribute("aria-label", t.commentDelete);
      deleteButton.addEventListener("click", () => {
        deleteButton.disabled = true;
        deletePlaceComment(comment.id, ui, item, Boolean(replies?.length));
      });
      meta.appendChild(deleteButton);
    }

    const reactionData = reactions?.[comment.id];
    const { row: reactionRow, replyButton } = createReactionRow(comment, myPubKeyHex, reactionData, ui);
    item.appendChild(reactionRow);

    if (!isReply) {
      const replyForm = createReplyForm(comment, ui);
      replyButton.addEventListener("click", () => {
        replyForm.hidden = !replyForm.hidden;
      });
      item.appendChild(replyForm);
    } else {
      replyButton.hidden = true;
    }

    return item;
  }

  function renderCommentsList(comments, ui, myPubKeyHex, profileNames, reactions, ratingsByAuthor) {
    const t = ctx.text[ctx.state.language];
    ui.list.replaceChildren();

    if (!comments.length) {
      ui.status.textContent = t.commentsNone;
      ui.status.hidden = false;
      return;
    }

    ui.status.hidden = true;

    const { topLevel, repliesByParent } = buildCommentTree(comments);
    topLevel.sort((a, b) => b.createdAt - a.createdAt);

    for (const comment of topLevel) {
      const replies = repliesByParent.get(comment.id) || [];
      const item = renderCommentItem(comment, myPubKeyHex, profileNames, reactions, ui, false, replies, ratingsByAuthor);
      ui.list.appendChild(item);

      if (replies.length) {
        const repliesWrap = document.createElement("div");
        repliesWrap.className = "place-comment-replies";
        for (const reply of replies) {
          repliesWrap.appendChild(
            renderCommentItem(reply, myPubKeyHex, profileNames, reactions, ui, true, [], ratingsByAuthor)
          );
        }
        ui.list.appendChild(repliesWrap);
      }
    }
  }

  async function getMyPubKeyHex() {
    const transport = window.OMAP_SYNC_TRANSPORT;
    const seedWords = ctx.getStoredSeedWords();
    if (!seedWords || !transport) return null;
    const cryptoApi = window.OMAP_SYNC_CRYPTO;
    const nostrLib = await transport.waitForNostrLib();
    const { nostrPrivKeyBytes } = await cryptoApi.deriveKeys(seedWords);
    return nostrLib.getPublicKey(nostrPrivKeyBytes);
  }

  async function loadPlaceCommentsForPlace(placeKey, ui) {
    const t = ctx.text[ctx.state.language];
    const transport = window.OMAP_SYNC_TRANSPORT;
    if (!transport) {
      ui.status.textContent = "";
      if (ui.spinner) ui.spinner.hidden = true;
      return;
    }

    ui.status.hidden = false;
    ui.status.textContent = t.commentsLoading;
    ui.status.classList.remove("is-clickable-retry");
    if (ui.spinner) ui.spinner.hidden = false;

    try {
      const myPubKeyHex = await getMyPubKeyHex();
      const comments = await transport.fetchComments(placeKey);

      const [profileNames, reactions, ratingsResult] = await Promise.all([
        comments.length
          ? transport.fetchProfileMetadata(comments.map(c => c.pubkey)).catch(() => ({}))
          : {},
        comments.length
          ? transport.fetchCommentReactions(comments.map(c => c.id), myPubKeyHex).catch(() => ({}))
          : {},
        transport.fetchRatings(placeKey, myPubKeyHex).catch(() => ({ byAuthor: {} }))
      ]);
      const ratingsByAuthor = ratingsResult?.byAuthor || {};

      renderCommentsList(comments, ui, myPubKeyHex, profileNames, reactions, ratingsByAuthor);
    } catch (error) {
      console.error("Nie udało się pobrać komentarzy miejsca:", error);
      ui.status.hidden = false;
      ui.status.textContent = t.commentsError;
      ui.status.title = t.commentsRetryHint || "";
      ui.status.classList.add("is-clickable-retry");
    } finally {
      if (ui.spinner) ui.spinner.hidden = true;
    }
  }

  async function submitPlaceComment(placeKey, placeMeta, rawText, ui, parentCommentId) {
    const t = ctx.text[ctx.state.language];
    const seedWords = ctx.getStoredSeedWords();

    if (!seedWords) {
      ctx.setPendingPlaceReturn?.(
        placeMeta?.placeSnapshot,
        { lat: placeMeta?.lat, lng: placeMeta?.lon }
      );
      ctx.openAccountFromMenu();
      return;
    }

    const text = (rawText || "").trim();
    if (!text) return;

    ui.submitButton.disabled = true;
    ui.textarea.disabled = true;

    try {
      const cryptoApi = window.OMAP_SYNC_CRYPTO;
      const transport = window.OMAP_SYNC_TRANSPORT;
      const { nostrPrivKeyBytes } = await cryptoApi.deriveKeys(seedWords);

      await transport.publishComment(nostrPrivKeyBytes, placeKey, text, placeMeta, parentCommentId);
      ui.textarea.value = "";
      await loadPlaceCommentsForPlace(placeKey, ui);
    } catch (error) {
      console.error("Nie udało się wysłać komentarza:", error);
      ui.status.hidden = false;
      ui.status.textContent = t.commentsError;
    } finally {
      ui.submitButton.disabled = false;
      ui.textarea.disabled = false;
    }
  }

  async function deletePlaceComment(commentId, ui, item, hasReplies) {
    const t = ctx.text[ctx.state.language];
    const seedWords = ctx.getStoredSeedWords();
    if (!seedWords) return;

    try {
      const cryptoApi = window.OMAP_SYNC_CRYPTO;
      const transport = window.OMAP_SYNC_TRANSPORT;
      const { nostrPrivKeyBytes } = await cryptoApi.deriveKeys(seedWords);

      await transport.deleteComment(nostrPrivKeyBytes, commentId);

      // Szybka sciezka: usuwamy element bezposrednio z DOM zamiast
      // przeladowywac cala liste (3 zapytania sieciowe) - dotyczy
      // wiekszosci przypadkow (komentarz bez odpowiedzi). Gdy
      // komentarz MIAL odpowiedzi, trzeba pelnego przeladowania -
      // po usunieciu rodzica jego odpowiedzi staja sie komentarzami
      // najwyzszego poziomu, co wymaga ponownego zbudowania calego
      // drzewa (buildCommentTree), nie da sie tego zrobic punktowo.
      if (!hasReplies && item) {
        item.remove();
        if (!ui.list.children.length) {
          ui.status.hidden = false;
          ui.status.textContent = t.commentsNone;
        }
        return;
      }

      await loadPlaceCommentsForPlace(ui.placeKey, ui);
    } catch (error) {
      console.error("Nie udało się usunąć komentarza:", error);
      ui.status.hidden = false;
      ui.status.textContent = t.commentsError;
    }
  }

  // Nostr nie pozwala edytowac istniejacego zdarzenia (sa
  // niemutowalne) - "edycja" to w praktyce usuniecie starego
  // komentarza i publikacja nowego z tym samym tekstem-rodzicem
  // (zachowuje miejsce w watku, jesli to byla odpowiedz). Z
  // perspektywy uzytkownika wyglada jak zwykla edycja.
  async function editPlaceComment(comment, rawText, ui, form, textElement, replies) {
    const t = ctx.text[ctx.state.language];
    const seedWords = ctx.getStoredSeedWords();
    if (!seedWords) return;

    const text = (rawText || "").trim();
    if (!text || text === comment.text) {
      form.hidden = true;
      if (textElement) textElement.hidden = false;
      return;
    }

    try {
      const cryptoApi = window.OMAP_SYNC_CRYPTO;
      const transport = window.OMAP_SYNC_TRANSPORT;
      const { nostrPrivKeyBytes } = await cryptoApi.deriveKeys(seedWords);

      const result = await transport.publishComment(
        nostrPrivKeyBytes, ui.placeKey, text, ui.placeMeta, comment.parentId
      );
      const newCommentId = result?.eventId;

      // WAZNE: edytowany komentarz dostaje NOWE id zdarzenia (Nostr
      // nie pozwala edytowac istniejacych zdarzen). Jesli mial
      // odpowiedzi, one wskazuja (przez tag "e") na STARE id - bez
      // "przepiecia" ich na nowe, po usunieciu starego zdarzenia
      // staly by sie osierocone i appka pokazywalaby je jako zwykle,
      // niepowiazane komentarze najwyzszego poziomu zamiast odpowiedzi.
      if (replies?.length && newCommentId) {
        for (const reply of replies) {
          try {
            await transport.publishComment(
              nostrPrivKeyBytes, ui.placeKey, reply.text, ui.placeMeta, newCommentId
            );
            await transport.deleteComment(nostrPrivKeyBytes, reply.id);
          } catch (replyError) {
            console.error("Nie udało się przepiąć odpowiedzi po edycji:", replyError);
          }
        }
      }

      await transport.deleteComment(nostrPrivKeyBytes, comment.id);

      if (!replies?.length && textElement) {
        // Szybka sciezka: bez odpowiedzi do przepiecia, wystarczy
        // podmienic sam tekst lokalnie - bez przeladowania calej
        // listy (3 zapytania sieciowe).
        textElement.textContent = text;
        form.hidden = true;
        textElement.hidden = false;
        return;
      }

      await loadPlaceCommentsForPlace(ui.placeKey, ui);
    } catch (error) {
      console.error("Nie udało się zapisać edycji komentarza:", error);
      ui.status.hidden = false;
      ui.status.textContent = t.commentsError;
    }
  }

  async function submitCommentReaction(commentId, reaction, ui, buttons) {
    const seedWords = ctx.getStoredSeedWords();
    if (!seedWords) {
      if (buttons) {
        buttons.likeButton.disabled = false;
        buttons.dislikeButton.disabled = false;
        buttons.reactionSpinner.hidden = true;
      }
      ctx.setPendingPlaceReturn?.(
        ui.placeMeta?.placeSnapshot,
        { lat: ui.placeMeta?.lat, lng: ui.placeMeta?.lon }
      );
      ctx.openAccountFromMenu();
      return;
    }

    try {
      const cryptoApi = window.OMAP_SYNC_CRYPTO;
      const transport = window.OMAP_SYNC_TRANSPORT;
      const { nostrPrivKeyBytes } = await cryptoApi.deriveKeys(seedWords);

      await transport.publishCommentReaction(nostrPrivKeyBytes, commentId, reaction);
      await loadPlaceCommentsForPlace(ui.placeKey, ui);
    } catch (error) {
      console.error("Nie udało się wysłać reakcji:", error);
      if (buttons) {
        buttons.likeButton.disabled = false;
        buttons.dislikeButton.disabled = false;
        buttons.reactionSpinner.hidden = true;
      }
    }
  }

  window.OMAP_COMMENTS = {
    configure,
    createSection: createCommentSection,
    loadForPlace: loadPlaceCommentsForPlace
  };
})();
