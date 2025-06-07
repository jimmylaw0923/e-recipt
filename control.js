let products = [];
let cart = [];

// 保存和加载产品列表
const saveProducts = () => localStorage.setItem("products", JSON.stringify(products));
const loadProducts = () => {
    const stored = localStorage.getItem("products");
    if (stored) products = JSON.parse(stored);
};

// 渲染类别按钮
const renderButtons = () => {
    const container = document.getElementById("category-buttons");
    container.innerHTML = "";
    // 添加“All”按钮
    const allBtn = document.createElement("button");
    allBtn.textContent = "All";
    allBtn.onclick = () => renderProductList();
    container.appendChild(allBtn);
    // 动态生成类别按钮
    [...new Set(products.map(p => p.category))].forEach(cat => {
        const btn = document.createElement("button");
        btn.textContent = cat;
        btn.onclick = () => renderProductList(cat);
        container.appendChild(btn);
    });
};

// 渲染产品列表
const renderProductList = (category = null) => {
    const list = document.getElementById("product-list");
    list.innerHTML = "";
    const items = category ? products.filter(p => p.category === category) : products;
    items.forEach(p => {
        const li = document.createElement("li");
        li.textContent = `${p.name} - RM${p.price.toFixed(2)}`;

        const addBtn = document.createElement("button");
        addBtn.textContent = "Add to Cart";
        addBtn.onclick = () => {
            const cartItem = cart.find(c => c.sku === p.sku);
            if (cartItem) cartItem.quantity++;
            else cart.push({ ...p, quantity: 1 });
            renderCart();
        };

        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.onclick = () => {
            if (confirm(`确认删除产品 ${p.name}？`)) {
                products = products.filter(item => item.sku !== p.sku);
                cart = cart.filter(item => item.sku !== p.sku);
                saveProducts();
                renderButtons();
                renderProductList();
                renderCart();
            }
        };

        li.append(addBtn, delBtn);
        list.appendChild(li);
    });
};

// 渲染购物车
const renderCart = () => {
    const list = document.getElementById("cart-list");
    list.innerHTML = "";
    cart.forEach((item, index) => {
        const li = document.createElement("li");
        li.textContent = `${item.name} ×${item.quantity} — RM${(item.price * item.quantity).toFixed(2)}`;

        const delBtn = document.createElement("button");
        delBtn.textContent = "Remove";
        delBtn.onclick = () => {
            cart.splice(index, 1);
            renderCart();
        };

        li.appendChild(delBtn);
        list.appendChild(li);
    });
    document.getElementById("total").textContent = "Total: RM" + calculateTotal().toFixed(2);
};

// 计算购物车总金额
const calculateTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

// 渲染交易记录列表
function renderTransactionHistory() {
    const historyList = document.getElementById("transaction-history");
    historyList.innerHTML = "";
    const transactions = JSON.parse(localStorage.getItem("transactions") || "[]");

    transactions.forEach(record => {
        const li = document.createElement("li");
        li.textContent = `${record.number} - ${record.type} - RM${record.total}`;

        // 查看PDF按钮
        const viewBtn = document.createElement("button");
        viewBtn.textContent = "View PDF";
        viewBtn.onclick = () => {
            recreatePDF(record);
        };

        // 删除交易按钮
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.onclick = () => {
            if (confirm("确定要删除此交易记录吗？")) {
                deleteTransaction(record.number);
            }
        };

        li.append(viewBtn, delBtn);
        historyList.appendChild(li);
    });
}

// 删除交易记录及更新计数器
function deleteTransaction(id) {
    let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
    const index = transactions.findIndex(t => t.number === id);
    if (index === -1) return;

    const record = transactions[index];
    const type = record.type;
    const seqNum = parseInt(record.number.slice(-3));

    transactions.splice(index, 1);
    localStorage.setItem("transactions", JSON.stringify(transactions));

    let counter = parseInt(localStorage.getItem(type + "Counter") || "0");
    if (seqNum === counter) {
        localStorage.setItem(type + "Counter", (counter - 1).toString());
    }

    renderTransactionHistory();
}

// 生成并打开PDF
function recreatePDF(record) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    createPDFContent(doc, record);
    doc.output('dataurlnewwindow');
}

// PDF内容绘制
function createPDFContent(doc, record) {
    const margin = 40;
    const pageHeight = doc.internal.pageSize.height;
    let y = margin;

    doc.setFont("Georgia", "bold");
    doc.setFontSize(36);
    doc.text("LONG EXSTREAM", doc.internal.pageSize.width / 2, y, { align: "center" });

    y += 30;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    [
        "11, JALAN SATU, MEDAN PEKAN",
        "02600 ARAU, PERLIS",
        "Tel: 012-4876000"
    ].forEach(line => {
        doc.text(line, doc.internal.pageSize.width / 2, y, { align: "center" });
        y += 14;
    });

    y += 20;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(27);
    doc.text(record.type, doc.internal.pageSize.width / 2, y, { align: "center" });
    y += 30;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`${record.type === "INVOICE" ? "Invoice No:" : "Receipt No:"} ${record.number}`, margin, y);
    y += 17;
    doc.text(`Date: ${record.date}`, margin, y);
    y += 17;
    doc.text(`Time: ${record.time}`, margin, y);
    y += 17;
    doc.text(`Seller: LONG`, margin, y);
    y += 25;

    y += 20;
    doc.line(margin, y, 550, y);
    y += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Item", margin, y);
    doc.text("Code", margin + 180, y);
    doc.text("Qty", margin + 260, y);
    doc.text("Unit Price", margin + 385, y, { align: "right" });
    doc.text("Total", margin + 465, y, { align: "right" });
    y += 10;
    doc.line(margin, y, 550, y);
    y += 15;

    doc.setFont("helvetica", "normal");
    record.items.forEach(item => {
        doc.text(item.name, margin, y);
        doc.text(item.sku, margin + 180, y);
        doc.text(`${item.quantity}`, margin + 270, y);
        doc.text(`RM${item.price.toFixed(2)}`, margin + 380, y, { align: "right" });
        doc.text(`RM${(item.quantity * item.price).toFixed(2)}`, margin + 485, y, { align: "right" });
        y += 18;
    });

    const bottomY = pageHeight - 80;
    doc.line(margin, bottomY, 550, bottomY);
    doc.setFont("helvetica", "bold");
    doc.text("Total Amount:", margin + 280, bottomY + 25);
    doc.text(`RM${record.total}`, margin + 480, bottomY + 25, { align: "right" });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.text("GOODS SOLD ARE NOT RETURNABLE", margin, pageHeight - 30);
}

// 生成PDF并保存，结账时调用
function generatePDF(docType, paymentType) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10);
    const lastDate = localStorage.getItem(docType + "Date");
    let counter = 1;

    if (lastDate === dateKey) {
        counter = parseInt(localStorage.getItem(docType + "Counter") || "0") + 1;
    } else {
        localStorage.setItem(docType + "Date", dateKey);
    }
    localStorage.setItem(docType + "Counter", counter.toString());

    const numberValue = (docType === "INVOICE" ? "INV" : "REC") +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(counter).padStart(3, '0');

    const record = {
        type: docType,
        number: numberValue,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        total: calculateTotal().toFixed(2),
        paymentType: paymentType,
        items: cart.map(item => ({ ...item })),
        timestamp: now.getTime()
    };

    // 保存交易记录
    const records = JSON.parse(localStorage.getItem("transactions") || "[]");
    records.push(record);
    localStorage.setItem("transactions", JSON.stringify(records));

    // 创建PDF
    createPDFContent(doc, record);
    doc.save(`${numberValue}_${docType}.pdf`);

    // 结账后清空购物车，重新渲染
    cart = [];
    renderCart();
    renderTransactionHistory();
}

// --- 事件绑定 ---

document.getElementById("show-add-product-btn").onclick = () => {
    document.getElementById("add-product-modal").style.display = "flex";
};

document.getElementById("add-product-submit").onclick = () => {
    const sku = document.getElementById("modal-sku").value.trim();
    const name = document.getElementById("modal-name").value.trim();
    const price = parseFloat(document.getElementById("modal-price").value);
    const category = document.getElementById("modal-category").value.trim();
    if (!sku || !name || isNaN(price) || !category) {
        alert("请填写所有字段，价格需为数字");
        return;
    }
    if (products.some(p => p.sku === sku)) {
        alert("该代号已存在，请使用其他代号");
        return;
    }
    products.push({ sku, name, price, category });
    saveProducts();
    renderButtons();
    renderProductList();
    document.getElementById("add-product-modal").style.display = "none";
};

document.getElementById("add-product-cancel").onclick = () => {
    document.getElementById("add-product-modal").style.display = "none";
};

document.getElementById("checkout-btn").onclick = () => {
    if (cart.length === 0) {
        alert("购物车为空！");
        return;
    }
    document.getElementById("checkout-modal").style.display = "flex";
};

document.getElementById("checkout-confirm").onclick = () => {
    const docType = document.querySelector('input[name="docType"]:checked').value;
    const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
    generatePDF(docType, paymentType);
    document.getElementById("checkout-modal").style.display = "none";
};

document.getElementById("checkout-cancel").onclick = () => {
    document.getElementById("checkout-modal").style.display = "none";
};

// --- 初始化 ---

// 初始添加产品（只会在 localStorage 没有数据时添加）
if (!localStorage.getItem("products")) {
    products = [];
    saveProducts();
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = "flex";
    modal.classList.add("show");
    modal.classList.remove("hide");
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add("hide");
    modal.classList.remove("show");
    modal.addEventListener("animationend", () => {
        if (modal.classList.contains("hide")) {
            modal.style.display = "none";
        }
    }, { once: true });
}

// 例子
document.getElementById("show-add-product-btn").onclick = () => openModal("add-product-modal");
document.getElementById("add-product-cancel").onclick = () => closeModal("add-product-modal");

document.getElementById("checkout-btn").onclick = () => {
    if (cart.length === 0) {
        alert("购物车为空！");
        return;
    }
    openModal("checkout-modal");
};
document.getElementById("checkout-cancel").onclick = () => closeModal("checkout-modal");

loadProducts();
renderButtons();
renderProductList();
renderCart();
renderTransactionHistory();
