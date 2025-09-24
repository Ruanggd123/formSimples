document.addEventListener("DOMContentLoaded", () => {
  // !! ATUALIZE AQUI COM A URL DO SEU DEPLOY (confirme que é a mais recente) !!
  const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyslFGbdD_dwsx693RvfULTH3PAPv-MdOzEREjVd2n0v49C1WOReNiYhdXn91Doe4HE/exec";
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

  // NOVO: Seleção dos botões de toggle
  const toggleListBtns = document.querySelectorAll(".toggle-list-btn");

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

  // --- Funções de Modal (Corrigidas para usar 'hidden') ---

  function openDeleteModal() {
    deleteModalOverlay.classList.remove("hidden");
    deleteAdminCodeInput.focus();
  }

  function closeDeleteModal() {
    deleteModalOverlay.classList.add("hidden");
    deleteAdminCodeInput.value = "";
    idToDelete = null;
    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = "Deletar";
  }

  function openReportModal() {
    reportModalOverlay.classList.remove("hidden");
    reportAdminCodeInput.focus();
  }

  function closeReportModal() {
    reportModalOverlay.classList.add("hidden");
    reportAdminCodeInput.value = "";
  }

  // --- Funções de Utilidade e Renderização ---

  function showMessage(text, type = "info") {
    message.textContent = text;
    message.className =
      type === "success"
        ? "message-success"
        : type === "error"
        ? "message-error"
        : "";
    setTimeout(() => {
      message.textContent = "";
      message.className = "";
    }, 5000);
  }

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
      listaNomesDiv.innerHTML = "";
      totalNomesSpan.textContent = data.length || 0;

      if (!Array.isArray(data) || data.length === 0) {
        listaNomesDiv.innerHTML =
          '<p class="empty-state">Nenhum nome na lista ainda.</p>';
        return;
      }

      const subir = data.filter(
        (item) => (item.acao || "").toString().trim().toLowerCase() === "subir"
      );
      const descer = data.filter(
        (item) => (item.acao || "").toString().trim().toLowerCase() === "descer"
      );

      subirCountSpan.textContent = subir.length;
      descerCountSpan.textContent = descer.length;

      const renderList = (title, items, icon, listType) => {
        if (items.length === 0) return;
        const container = document.createElement("div");
        container.classList.add("list-group");
        container.dataset.listType = listType;

        const isHidden =
          localStorage.getItem(`list-${listType}-hidden`) === "true";
        if (isHidden) {
          container.classList.add("hidden");
        }

        const h = document.createElement("h3");
        h.innerHTML = `${icon} ${title}`;
        container.appendChild(h);

        items.forEach((item) => {
          const div = document.createElement("div");
          div.className = "list-item";

          const span = document.createElement("span");
          // Formatação do nome mais bonito e forte
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

        // Atualiza o texto do botão de toggle correspondente
        const btn = document.querySelector(
          `.toggle-list-btn[data-list="${listType}"]`
        );
        if (btn) {
          btn.textContent = isHidden ? "Mostrar" : "Esconder";
        }
      };

      renderList("Passageiros Subindo", subir, "🔼", "subir");
      renderList("Passageiros Descendo", descer, "🔽", "descer");
    } catch (err) {
      console.error("[carregarLista] erro:", err);
      listaNomesDiv.innerHTML =
        '<p class="empty-state">Erro ao carregar a lista.</p>';
      showMessage("Erro ao carregar lista: " + err.message, "error");
    }
  }

  // --- Função de Toggle (Esconder/Mostrar) ---

  const handleToggleList = (event) => {
    const listType = event.currentTarget.dataset.list;
    const listContainer = document.querySelector(
      `[data-list-type="${listType}"]`
    );
    if (!listContainer) return;

    listContainer.classList.toggle("hidden");
    const isHidden = listContainer.classList.contains("hidden");

    localStorage.setItem(`list-${listType}-hidden`, isHidden);
    event.currentTarget.textContent = isHidden ? "Mostrar" : "Esconder";
  };

  // --- Funções de Eventos ---

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nomeInput = form.querySelector('[name="nome"]');
    const acaoInput = form.querySelector('[name="acao"]');
    const localInput = form.querySelector('[name="local"]');

    if (!nomeInput || !acaoInput || !localInput) {
      showMessage(
        "Erro: inputs do formulário devem ter name='nome', name='acao', name='local'.",
        "error"
      );
      return;
    }

    const nomeVal = nomeInput.value.trim();
    const acaoVal = acaoInput.value.trim();
    if (!nomeVal) {
      showMessage("Digite um nome válido.", "error");
      return;
    }

    // VERIFICAÇÃO DE LIMITE
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
      formData.append("nome", nomeVal);
      formData.append("acao", acaoVal);
      formData.append("local", localInput.value.trim());
      formData.append("action", "add");

      const res = await fetch(SCRIPT_URL, { method: "POST", body: formData });
      const contentType = res.headers.get("content-type") || "";
      const payload =
        contentType.indexOf("application/json") !== -1
          ? await res.json()
          : await res.text();

      if (typeof payload === "object" && payload.status === "success") {
        showMessage("Nome adicionado com sucesso!", "success");
        form.reset();
        await carregarLista();
      } else {
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
    openDeleteModal(); // <--- CHAMA FUNÇÃO DE ABRIR MODAL
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
      closeDeleteModal(); // <--- CHAMA FUNÇÃO DE FECHAR MODAL
    }
  }

  // Generate report
  function handleGenerateReportClick() {
    openReportModal(); // <--- CHAMA FUNÇÃO DE ABRIR MODAL
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

    // O Apps Script foi ajustado para fazer o download direto
    const downloadUrl = `${SCRIPT_URL}?action=downloadReport&type=${reportType}&adminCode=${encodeURIComponent(
      adminCode
    )}`;
    window.open(downloadUrl, "_blank");
    closeReportModal(); // <--- CHAMA FUNÇÃO DE FECHAR MODAL
  }

  function checkTime() {
    const now = new Date();
    const hour = now.getHours();
    const isOpen = hour >= 13 && hour < 21;
    if (isOpen) {
      form.classList.remove("hidden");
      closedMessage.classList.add("hidden");
    } else {
      form.classList.add("hidden");
      closedMessage.classList.remove("hidden");
    }
  }

  // --- Inicialização e Handlers ---

  // event handlers
  cancelDeleteBtn.addEventListener("click", closeDeleteModal);
  confirmDeleteBtn.addEventListener("click", confirmDelete);
  generateReportBtn.addEventListener("click", handleGenerateReportClick);
  cancelReportBtn.addEventListener("click", closeReportModal);
  confirmReportBtn.addEventListener("click", confirmGenerateReport);

  // Handlers para os botões de toggle (NOVO)
  toggleListBtns.forEach((btn) =>
    btn.addEventListener("click", handleToggleList)
  );

  // inicial
  checkTime();
  carregarLista();
  setInterval(checkTime, 60000);
  setInterval(carregarLista, 15000);
});
