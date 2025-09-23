document.addEventListener("DOMContentLoaded", () => {
  // !! ATUALIZE AQUI COM A URL DO SEU DEPLOY (confirme que é a mais recente) !!
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbydSZdJxMjJIlYEtq9VzxyGuYb86bAo35swbM3B08gvChGUpCHVspiI-LoXGLqxoeGS/exec";
  const LIST_LIMIT = 46;

  // DOM
  const form = document.getElementById("nameForm");
  const closedMessage = document.getElementById("closedMessage");
  const message = document.getElementById("message");
  const submitButton = document.getElementById("submitButton");
  const listaNomesDiv = document.getElementById("listaNomes");
  const totalNomesSpan = document.getElementById("totalNomes");
  const subirCountSpan = document.getElementById("subirCount");
  const descerCountSpan = document.getElementById("descerCount");

  // Admin modals
  const generateReportBtn = document.getElementById("generate-report-btn");
  const deleteModalOverlay = document.getElementById("delete-modal-overlay");
  const deleteAdminCodeInput = document.getElementById(
    "delete-admin-code-input"
  );
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  let idToDelete = null;

  const reportModalOverlay = document.getElementById("report-modal-overlay");
  const reportAdminCodeInput = document.getElementById(
    "report-admin-code-input"
  );
  const cancelReportBtn = document.getElementById("cancel-report-btn");
  const confirmReportBtn = document.getElementById("confirm-report-btn");

  // Util: mensagens
  function showMessage(text, type = "info") {
    message.textContent = text;
    message.className =
      type === "success"
        ? "message-success"
        : type === "error"
        ? "message-error"
        : "";
    console.log("[UI] " + text);
    setTimeout(() => {
      message.textContent = "";
      message.className = "";
    }, 5000);
  }

  // Carrega lista -> agora com cacheBust e logs
  async function carregarLista() {
    try {
      const url = SCRIPT_URL + "?cacheBust=" + new Date().getTime();
      const res = await fetch(url, { method: "GET", cache: "no-store" });
      if (!res.ok) {
        throw new Error(
          "Resposta do servidor: " + res.status + " " + res.statusText
        );
      }
      const data = await res.json();
      console.log("[carregarLista] dados:", data);
      listaNomesDiv.innerHTML = "";
      totalNomesSpan.textContent = data.length || 0;

      if (!Array.isArray(data) || data.length === 0) {
        listaNomesDiv.innerHTML =
          '<p class="empty-state">Nenhum nome na lista ainda.</p>';
        return;
      }

      // separar subir/descer
      const subir = data.filter(
        (item) => (item.acao || "").toString().trim().toLowerCase() === "subir"
      );
      const descer = data.filter(
        (item) => (item.acao || "").toString().trim().toLowerCase() === "descer"
      );

      // Exibe a contagem
      subirCountSpan.textContent = subir.length;
      descerCountSpan.textContent = descer.length;

      const renderList = (title, items) => {
        if (items.length === 0) return;
        const container = document.createElement("div");
        const h = document.createElement("h3");
        h.innerText = `${title} (${items.length})`;
        container.appendChild(h);
        items.forEach((item) => {
          const div = document.createElement("div");
          div.className = "list-item";
          // nome em bold e local
          const span = document.createElement("span");
          // CORREÇÃO: Converte explicitamente para string para evitar o erro
          span.innerHTML = `<strong>${escapeHtml(
            String(item.nome || "")
          )}</strong> - ${escapeHtml(String(item.local || ""))}`;
          const btn = document.createElement("button");
          btn.className = "delete-btn";
          btn.title = "Deletar";
          btn.dataset.id = item.id;
          btn.innerText = "🗑️";
          btn.addEventListener("click", handleDeleteClick);
          div.appendChild(span);
          div.appendChild(btn);
          container.appendChild(div);
        });
        listaNomesDiv.appendChild(container);
      };

      renderList("🔼 Vai Subir", subir);
      renderList("🔽 Vai Descer", descer);
    } catch (err) {
      console.error("[carregarLista] erro:", err);
      listaNomesDiv.innerHTML =
        '<p class="empty-state">Erro ao carregar a lista.</p>';
      showMessage("Erro ao carregar lista: " + err.message, "error");
    }
  }

  // Evita injection (simples)
  function escapeHtml(s) {
    if (!s) return "";
    return s.replace(/[&<>"'`=\/]/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "`": "&#96;",
        "/": "&#x2F;",
      }[c];
    });
  }

  // Submit do form (adicionar nome)
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Valida presença de inputs esperados
    const nomeInput = form.querySelector('[name="nome"]');
    const acaoInput = form.querySelector('[name="acao"]');
    const localInput = form.querySelector('[name="local"]');

    if (!nomeInput || !acaoInput || !localInput) {
      showMessage(
        "Erro: inputs do formulário devem ter name='nome', name='acao', name='local'.",
        "error"
      );
      console.error("Form inputs faltando. Verifique o HTML.");
      return;
    }

    // simples validação
    const nomeVal = nomeInput.value.trim();
    const acaoVal = acaoInput.value.trim();
    if (!nomeVal) {
      showMessage("Digite um nome válido.", "error");
      return;
    }

    // VERIFICAÇÃO DE LIMITE AQUI
    const subirCount = parseInt(subirCountSpan.textContent);
    const descerCount = parseInt(descerCountSpan.textContent);

    if (acaoVal === "subir" && subirCount >= LIST_LIMIT) {
      showMessage(
        `Limite de ${LIST_LIMIT} nomes para subir atingido.`,
        "error"
      );
      return;
    }
    if (acaoVal === "descer" && descerCount >= LIST_LIMIT) {
      showMessage(
        `Limite de ${LIST_LIMIT} nomes para descer atingido.`,
        "error"
      );
      return;
    }
    if (
      acaoVal === "subir_descer" &&
      (subirCount >= LIST_LIMIT || descerCount >= LIST_LIMIT)
    ) {
      showMessage(
        `Uma das listas já atingiu o limite de ${LIST_LIMIT} nomes.`,
        "error"
      );
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Enviando...";

    try {
      const formData = new FormData();
      // IMPORTANT: o Apps Script espera nome, acao, local (uso exatamente esses nomes)
      formData.append("nome", nomeVal);
      formData.append("acao", acaoVal);
      formData.append("local", localInput.value.trim());
      // action diferente do 'delete' faz o append normal no server
      formData.append("action", "add");

      const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
      // tenta tratar JSON, mas se não for JSON pega texto
      const contentType = res.headers.get("content-type") || "";
      const payload =
        contentType.indexOf("application/json") !== -1
          ? await res.json()
          : await res.text();

      console.log("[submit] resposta:", payload);

      if (typeof payload === "object" && payload.status === "success") {
        showMessage("Nome adicionado com sucesso!", "success");
        form.reset();
        await carregarLista();
      } else if (
        typeof payload === "object" &&
        payload.status === "limit_reached"
      ) {
        showMessage("Limite de nomes atingido!", "error");
      } else {
        // se payload for texto, mostra no UI
        showMessage(
          "Erro ao enviar: " +
            (payload.message || payload || "resposta inesperada"),
          "error"
        );
      }
    } catch (err) {
      console.error("[submit] erro:", err);
      showMessage("Erro de conexão. Tente novamente.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Adicionar à Lista";
    }
  });

  // Delete flow
  function handleDeleteClick(event) {
    idToDelete = event.currentTarget.dataset.id;
    if (!idToDelete) {
      showMessage("ID não encontrado para deletar.", "error");
      return;
    }
    deleteModalOverlay.classList.remove("hidden");
    deleteAdminCodeInput.focus();
  }

  async function confirmDelete() {
    const adminCode = deleteAdminCodeInput.value.trim();
    if (!adminCode) {
      alert("Insira o código!");
      return;
    }

    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = "Deletando...";

    try {
      const formData = new FormData();
      formData.append("action", "delete");
      formData.append("uniqueID", idToDelete);
      formData.append("adminCode", adminCode);

      const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
      const contentType = res.headers.get("content-type") || "";
      const payload =
        contentType.indexOf("application/json") !== -1
          ? await res.json()
          : await res.text();

      console.log("[confirmDelete] resposta:", payload);

      if (typeof payload === "object" && payload.status === "deleted") {
        showMessage("Nome deletado com sucesso!", "success");
        await carregarLista();
      } else if (
        typeof payload === "object" &&
        payload.status === "invalid_code"
      ) {
        showMessage("Código de administrador incorreto!", "error");
      } else {
        showMessage(
          "Erro ao deletar: " +
            (payload.message || payload || "resposta inesperada"),
          "error"
        );
      }
    } catch (err) {
      console.error("[confirmDelete] erro:", err);
      showMessage("Erro de conexão ao deletar.", "error");
    } finally {
      closeDeleteModal();
    }
  }

  // Generate report (abre em nova aba)
  function handleGenerateReportClick() {
    reportModalOverlay.classList.remove("hidden");
    reportAdminCodeInput.focus();
  }

  function confirmGenerateReport() {
    const adminCode = reportAdminCodeInput.value.trim();
    if (!adminCode) {
      alert("Insira o código!");
      return;
    }
    const reportType = document.querySelector(
      'input[name="reportType"]:checked'
    ).value;
    const downloadUrl = `${SCRIPT_URL}?action=downloadReport&type=${reportType}&adminCode=${encodeURIComponent(
      adminCode
    )}`;
    window.open(downloadUrl, "_blank");
    closeReportModal();
  }

  function closeDeleteModal() {
    deleteModalOverlay.classList.add("hidden");
    deleteAdminCodeInput.value = "";
    idToDelete = null;
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = "Deletar";
  }

  function closeReportModal() {
    reportModalOverlay.classList.add("hidden");
    reportAdminCodeInput.value = "";
  }

  function checkTime() {
    const now = new Date();
    const hour = now.getHours();
    const isOpen = hour >= 13 && hour < 20;
    if (isOpen) {
      form.classList.remove("hidden");
      closedMessage.classList.add("hidden");
    } else {
      form.classList.add("hidden");
      closedMessage.classList.remove("hidden");
    }
  }

  // event handlers
  cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  confirmDeleteBtn.addEventListener("click", confirmDelete);
  generateReportBtn.addEventListener("click", handleGenerateReportClick);
  cancelReportBtn.addEventListener("click", closeReportModal);
  confirmReportBtn.addEventListener("click", confirmGenerateReport);

  // inicial
  checkTime();
  carregarLista();
  setInterval(checkTime, 60000);
  setInterval(carregarLista, 15000);
});
