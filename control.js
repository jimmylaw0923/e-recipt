let products = [];
        let cart = [];

        const saveProducts = () => localStorage.setItem("products", JSON.stringify(products));
        const loadProducts = () => {
            const stored = localStorage.getItem("products");
            if (stored) products = JSON.parse(stored);
        };

        const renderButtons = () => {
            const container = document.getElementById("category-buttons");
            container.innerHTML = "";

            const allBtn = document.createElement("button");
            allBtn.textContent = "All";
            allBtn.onclick = () => {
                renderProductList();
            };
            container.appendChild(allBtn);

            [...new Set(products.map(p => p.category))].forEach(cat => {
                const btn = document.createElement("button");
                btn.textContent = cat;
                btn.onclick = () => renderProductList(cat);
                container.appendChild(btn);
            });
        };

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
                    products = products.filter(item => item.sku !== p.sku);
                    cart = cart.filter(item => item.sku !== p.sku);
                    saveProducts();
                    renderButtons();
                    renderProductList();
                    renderCart();
                };

                li.append(addBtn, delBtn);
                list.appendChild(li);
            });
        };

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

        const calculateTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

        const getInvoiceInfo = () => {
            const now = new Date();
            const dateKey = now.toISOString().slice(0, 10);
            const lastDate = localStorage.getItem("invoiceDate");
            let counter = 1;

            if (lastDate === dateKey) {
                counter = parseInt(localStorage.getItem("invoiceCounter") || "0") + 1;
            } else {
                localStorage.setItem("invoiceDate", dateKey);
            }

            localStorage.setItem("invoiceCounter", counter.toString());
            return {
                number: `INV${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(counter).padStart(3, '0')}`,
                date: now.toLocaleDateString(),
                time: now.toLocaleTimeString()
            };
        };

        // -------------- Checkout Modal Handling ----------------
        const checkoutModal = document.getElementById("checkout-modal");
        const checkoutBtn = document.getElementById("checkout-btn");
        const checkoutConfirmBtn = document.getElementById("checkout-confirm");
        const checkoutCancelBtn = document.getElementById("checkout-cancel");

        checkoutBtn.addEventListener("click", () => {
            if (!cart.length) return alert("Cart is empty.");
            checkoutModal.style.display = "flex";
        });

        checkoutCancelBtn.addEventListener("click", () => {
            checkoutModal.style.display = "none";
        });

        checkoutConfirmBtn.addEventListener("click", () => {
            const docType = document.querySelector('input[name="docType"]:checked').value;
            const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
            checkoutModal.style.display = "none";
            generatePDF(docType, paymentType);
        });

        // -------------- PDF 生成 ----------------
        async function generatePDF(docType, paymentType) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: "pt", format: "a4" });

            // 获取当前日期和计数
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

            // 根据类型生成编号格式
            let numberLabel = "";
            let numberValue = "";
            if (docType === "INVOICE") {
                numberLabel = "Invoice No:";
                numberValue = `INV${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(counter).padStart(3, '0')}`;
            } else if (docType === "RECEIPT") {
                numberLabel = "Receipt No:";
                numberValue = `REC${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(counter).padStart(3, '0')}`;
            }

            const margin = 40;
            const pageHeight = doc.internal.pageSize.height;
            let y = margin;

            // 标题 THE PUNCH
            doc.setFont("Georgia", "bold");
            doc.setFontSize(36);
            doc.text("LONG EXSTREAM", doc.internal.pageSize.width / 2, y, { align: "center" });

            y += 30;

            // 地址，居中显示
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            const pageWidth = doc.internal.pageSize.width;
            const addresses = [
                "11, JALAN SATU, MEDAN PEKAN",
                "02600 ARAU, PERLIS",
                "Tel: 012-4876000"
            ];
            addresses.forEach(line => {
                doc.text(line, pageWidth / 2, y, { align: "center" });
                y += 14;
            });

            y += 10;
            doc.line(margin, y, 550, y);
            y += 20;

            y += 10;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(27);
            doc.text(docType, doc.internal.pageSize.width / 2, y, { align: "center" });
            y += 30;

            // 编号、日期、时间
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            doc.text(`${numberLabel} ${numberValue}`, margin, y);
            y += 17;
            doc.text(`Date: ${now.toLocaleDateString()}`, margin, y);
            y += 17;
            doc.text(`Time: ${now.toLocaleTimeString()}`, margin, y);
            y += 17;
            doc.text("Seller: LONG", margin, y);
            y += 25;

            // 商品列表标题及明细（和你原代码一致）
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
            cart.forEach(item => {
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
            doc.text(`RM${calculateTotal().toFixed(2)}`, margin + 480, bottomY + 25, { align: "right" });

            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.text("GOODS SOLD ARE NOT RETURNABLE", margin, pageHeight - 30);

            doc.save(`${numberValue}_${docType}.pdf`);

            cart = [];
            renderCart();
            doc.output('dataurlnewwindow');
        }

        

        // ---------------- Add Product Modal 事件 ----------------
        const modal = document.getElementById("add-product-modal");
        document.getElementById("show-add-product-btn").onclick = () => {
            ["sku", "name", "price", "category"].forEach(id => document.getElementById(`modal-${id}`).value = "");
            modal.style.display = "flex";
        };

        document.getElementById("add-product-cancel").onclick = () => modal.style.display = "none";

        document.getElementById("add-product-submit").onclick = () => {
            const sku = document.getElementById("modal-sku").value.trim();
            const name = document.getElementById("modal-name").value.trim();
            const price = parseFloat(document.getElementById("modal-price").value);
            const category = document.getElementById("modal-category").value.trim();

            if (!sku || !name || isNaN(price) || !category) {
                alert("Please enter valid product data.");
                return;
            }
            if (products.find(p => p.sku === sku)) {
                alert("SKU already exists.");
                return;
            }

            products.push({ sku, name, price, category });
            saveProducts();
            modal.style.display = "none";
            renderButtons();
            renderProductList();
        };

        // 初始化加载
        loadProducts();
        renderButtons();
        renderProductList();
        renderCart();