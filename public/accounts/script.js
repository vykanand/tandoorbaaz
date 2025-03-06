import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  limit,
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAEKHWdRyzI8WyBeGeesjDrM-nEzOXCuNk",
  authDomain: "billion1-a9324.firebaseapp.com",
  projectId: "billion1-a9324",
  storageBucket: "billion1-a9324.firebasestorage.app",
  messagingSenderId: "443716692865",
  appId: "1:443716692865:web:96813fe32a44f8342cd680",
  measurementId: "G-FE7NFHY5PG",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// State Management
let partners = [];
let totalSales = 0;
let openingBalance = 0;
let closingBalance = 0;
let totalDebit = 0;
let totalCredit = 0;
let dailyTransactions = {
  debit: 0,
  credit: 0,
};

// Firestore References
const accountingRef = collection(db, "accounting");
const transactionsRef = collection(db, "accounting/transactions/records");
const closingHistoryRef = collection(db, "accounting/history/closing");

// Core Functions
async function fetchData() {
  try {
    showLoader();
    const [partnersDoc, balancesDoc, dailyDoc] = await Promise.all([
      getDoc(doc(accountingRef, "partners")),
      getDoc(doc(accountingRef, "balances")),
      getDoc(doc(accountingRef, "daily")),
    ]);

    // Load partners
    partners = partnersDoc.exists() ? partnersDoc.data().partners : [];

    if (balancesDoc.exists()) {
      openingBalance = balancesDoc.data().openingBalance || 0;
      closingBalance = balancesDoc.data().closingBalance || 0;
    } else {
      // Initialize with zero if document doesn't exist
      openingBalance = 0;
      closingBalance = 0;
    }

    if (dailyDoc.exists()) {
      dailyTransactions.debit = dailyDoc.data().totalDebit || 0;
      dailyTransactions.credit = dailyDoc.data().totalCredit || 0;
    } else {
      // Initialize with zero if document doesn't exist
      dailyTransactions.debit = 0;
      dailyTransactions.credit = 0;
    }

    await Promise.all([
      updateUI(),
      updateTransactionHistory(),
      updateDailyTotals(),
      updateClosingHistory(),
      updatePartnerBalances(),
    ]);
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    hideLoader();
  }
}

async function recordTransaction() {
  showLoader();
  const partner = document.getElementById("transactionPartner").value;
  const amount = parseFloat(document.getElementById("transactionAmount").value);
  const type = document.getElementById("transactionType").value;
  const comment = document.getElementById("transactionComment")?.value?.trim();

  if (!partner || isNaN(amount) || amount <= 0 || !comment) {
    alert("Please fill all fields correctly");
    hideLoader();
    return;
  }

  try {
    const transaction = {
      partner,
      amount,
      type,
      comment,
      timestamp: serverTimestamp(),
    };

    await addDoc(transactionsRef, transaction);
    await updateBalances(amount, type);
    await Promise.all([updateTransactionHistory(), updateDailyTotals()]);

    // Reset form
    document.getElementById("transactionAmount").value = "";
      document.getElementById("transactionComment").value = "";
      updatePartnerBalances();
  } catch (error) {
    console.error("Error recording transaction:", error);
  }
  
  hideLoader();
}

async function updateBalances(amount, type) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (type === "debit") {
    dailyTransactions.debit += Number(amount);
  } else {
    dailyTransactions.credit += Number(amount);
  }

  // Calculate closing balance based on opening balance and net transaction amount
  closingBalance =
    openingBalance + (dailyTransactions.credit - dailyTransactions.debit);

  try {
    await Promise.all([
      setDoc(doc(accountingRef, "balances"), {
        openingBalance,
        closingBalance,
        lastUpdated: serverTimestamp(),
      }),
      setDoc(doc(accountingRef, "daily"), {
        totalDebit: dailyTransactions.debit,
        totalCredit: dailyTransactions.credit,
        lastUpdated: serverTimestamp(),
      }),
    ]);
    updateUI();
  } catch (error) {
    console.error("Error updating balances:", error);
  }
}


async function updateDailyTotals() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const q = query(
    transactionsRef,
    where("timestamp", ">=", today),
    orderBy("timestamp", "desc")
  );

  const querySnapshot = await getDocs(q);
  let dailyDebit = 0;
  let dailyCredit = 0;

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.type === "debit") {
      dailyDebit += Number(data.amount);
    } else {
      dailyCredit += Number(data.amount);
    }
  });

  const runningPnL = dailyCredit - dailyDebit;
  dailyTransactions.debit = dailyDebit;
  dailyTransactions.credit = dailyCredit;

  // Set totalSales to the running P&L
  totalSales = runningPnL;

  // Update UI elements
  const elements = {
    debit: document.getElementById("totalDebit"),
    credit: document.getElementById("totalCredit"),
    pnl: document.getElementById("shopSales"),
  };

  if (elements.debit) elements.debit.textContent = `₹${dailyDebit}`;
  if (elements.credit) elements.credit.textContent = `₹${dailyCredit}`;
  if (elements.pnl) {
    elements.pnl.textContent = `₹${Math.abs(runningPnL)}`;
    elements.pnl.className = `text-2xl font-bold ${
      runningPnL >= 0 ? "text-green-600" : "text-red-600"
    }`;
  }
}


async function updatePartnerBalances() {
  const partnerBalances = {};
  partners.forEach((partner) => {
    partnerBalances[partner] = { collected: 0, paid: 0 };
  });

  const q = query(transactionsRef, orderBy("timestamp", "desc"));
  const querySnapshot = await getDocs(q);

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.type === "credit") {
      partnerBalances[data.partner].collected += Number(data.amount);
    } else {
      partnerBalances[data.partner].paid += Number(data.amount);
    }
  });

  const tbody = document.getElementById("partnerBalancesList");
  if (!tbody) return;

  tbody.innerHTML = "";
  Object.entries(partnerBalances).forEach(([partner, amounts]) => {
    const netBalance = amounts.collected - amounts.paid;
    const row = document.createElement("tr");
    row.innerHTML = `
            <td class="px-4 py-2">${partner}</td>
            <td class="px-4 py-2 text-green-600">₹${amounts.collected}</td>
            <td class="px-4 py-2 text-red-600">₹${amounts.paid}</td>
            <td class="px-4 py-2 ${
              netBalance >= 0 ? "text-green-600" : "text-red-600"
            } font-bold">
                ₹${Math.abs(netBalance)} ${
      netBalance >= 0 ? "(Collect plz!)" : "(Pay plz!)"
    }
            </td>
        `;
    tbody.appendChild(row);
  });
}


async function closeDay() {
  showLoader();
  try {
    const netProfitLoss = dailyTransactions.credit - dailyTransactions.debit;
    const closingRecord = {
      date: new Date().toLocaleDateString(),
      openingBalance,
      closingBalance,
      totalDebit: dailyTransactions.debit,
      totalCredit: dailyTransactions.credit,
      netProfitLoss,
      timestamp: serverTimestamp(),
    };

    // Save closing record
    await addDoc(closingHistoryRef, closingRecord);

    // Set next day's opening balance
    const nextDayOpeningBalance = closingBalance;

    // Reset daily transactions
    dailyTransactions = { debit: 0, credit: 0 };

    // Update database for next day
    await Promise.all([
      setDoc(doc(accountingRef, "balances"), {
        openingBalance: nextDayOpeningBalance,
        closingBalance: nextDayOpeningBalance,
        lastUpdated: serverTimestamp(),
      }),
      setDoc(doc(accountingRef, "daily"), {
        totalDebit: 0,
        totalCredit: 0,
        lastUpdated: serverTimestamp(),
      }),
    ]);

    // Update local state
    openingBalance = nextDayOpeningBalance;
    closingBalance = nextDayOpeningBalance;

    await Promise.all([
      updateUI(),
      updateClosingHistory(),
      updateDailyTotals(),
    ]);

    alert("Day closed successfully! Opening balance for next day set.");
  } catch (error) {
    console.error("Error closing day:", error);
  }
  hideLoader();
}

async function updateClosingHistory() {
  const historyDiv = document.getElementById("closingHistory");
  if (!historyDiv) return;

  const historyQuery = query(
    closingHistoryRef,
    orderBy("timestamp", "desc"),
    limit(7)
  );

  const snapshot = await getDocs(historyQuery);
  let historyHTML = "";

  snapshot.forEach((doc) => {
    const data = doc.data();
    historyHTML += `
            <div class="text-sm border-b py-2">
                <div class="font-medium">${data.date}</div>
                <div class="text-gray-600">Opening: ₹${
                  data.openingBalance
                }</div>
                <div class="text-gray-600">Closing: ₹${
                  data.closingBalance
                }</div>
                <div class="flex justify-between">
                    <span class="text-red-600">Debit: ₹${data.totalDebit}</span>
                    <span class="text-green-600">Credit: ₹${
                      data.totalCredit
                    }</span>
                </div>
                <div class="font-medium ${
                  data.netProfitLoss >= 0 ? "text-green-600" : "text-red-600"
                }">
                    Net ${
                      data.netProfitLoss >= 0 ? "Profit" : "Loss"
                    }: ₹${Math.abs(data.netProfitLoss)}
                </div>
            </div>
        `;
  });

  historyDiv.innerHTML = historyHTML;
}

async function updateTransactionHistory(
  filterType = "today",
  startDate = null,
  endDate = null
) {
  const tbody = document.querySelector("#transactionHistory tbody");
  if (!tbody) return;

  try {
    let constraints = [];
    const now = new Date();

    switch (filterType) {
      case "today":
        constraints.push(
          where("timestamp", ">=", new Date(now.setHours(0, 0, 0, 0)))
        );
        break;
      case "week":
        constraints.push(
          where("timestamp", ">=", new Date(now.setDate(now.getDate() - 7)))
        );
        break;
      case "month":
        constraints.push(
          where("timestamp", ">=", new Date(now.setMonth(now.getMonth() - 1)))
        );
        break;
      case "custom":
        if (startDate)
          constraints.push(where("timestamp", ">=", new Date(startDate)));
        if (endDate) {
          const endDateTime = new Date(endDate);
          endDateTime.setHours(23, 59, 59, 999);
          constraints.push(where("timestamp", "<=", endDateTime));
        }
        break;
    }

    constraints.push(orderBy("timestamp", "desc"));
    const q = query(transactionsRef, ...constraints);
    const querySnapshot = await getDocs(q);

    tbody.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const row = document.createElement("tr");
      row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${data.partner}</td>
                <td class="px-6 py-4 whitespace-nowrap text-red-600">${
                  data.type === "debit" ? `₹${data.amount}` : ""
                }</td>
                <td class="px-6 py-4 whitespace-nowrap text-green-600">${
                  data.type === "credit" ? `₹${data.amount}` : ""
                }</td>
                <td class="px-6 py-4 whitespace-nowrap">${data.comment}</td>
                <td class="px-6 py-4 whitespace-nowrap">${
                  data.timestamp
                    ? new Date(data.timestamp.toDate()).toLocaleString()
                    : "Pending"
                }</td>
            `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Error updating transaction history:", error);
  }
}

function updateUI() {
  const elements = {
    partnerList: document.getElementById("partnerList"),
    dropdown: document.getElementById("transactionPartner"),
    shopSales: document.getElementById("shopSales"),
    openingBalance: document.getElementById("openingBalance"),
    closingBalance: document.getElementById("closingBalance"),
    totalDebit: document.getElementById("totalDebit"),
    totalCredit: document.getElementById("totalCredit"),
  };

  Object.entries(elements).forEach(([key, element]) => {
    if (!element) return;

    switch (key) {
      case "partnerList":
        element.innerHTML = partners
          .map((partner) => `<li>${partner}</li>`)
          .join("");
        break;
      case "dropdown":
        element.innerHTML = `
                    <option value="">Select Partner</option>
                    ${partners
                      .map(
                        (partner) =>
                          `<option value="${partner}">${partner}</option>`
                      )
                      .join("")}
                `;
        break;
      case "shopSales":
        element.textContent = `₹${totalSales}`;
        break;
      case "openingBalance":
        element.textContent = `₹${openingBalance}`;
        break;
      case "closingBalance":
        element.textContent = `₹${closingBalance}`;
        break;
      case "totalDebit":
        element.textContent = `₹${totalDebit}`;
        break;
      case "totalCredit":
        element.textContent = `₹${totalCredit}`;
        break;
    }
  });
}

function showLoader() {
  document.getElementById("overlay").style.display = "block";
  document.getElementById("loader").style.display = "block";
}

function hideLoader() {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("loader").style.display = "none";
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  const timeFilter = document.getElementById("timeFilter");
  if (timeFilter) {
    timeFilter.addEventListener("change", (e) => {
      const customDateDiv = document.getElementById("customDateRange");
      if (customDateDiv) {
        customDateDiv.style.display =
          e.target.value === "custom" ? "flex" : "none";
      }
    });
  }
  fetchData();
});

function applyFilter() {
  const filterType = document.getElementById("timeFilter").value;
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  updateTransactionHistory(filterType, startDate, endDate);
}

// Export functions to window object
Object.assign(window, {
  recordTransaction,
  updateTransactionHistory,
  applyFilter,
  closeDay,
});
