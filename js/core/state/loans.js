let loans = [];
let listeners = [];

export function addLoan(loan) {
    loans.push({ id: crypto.randomUUID(), createdAt: new Date(), ...loan });
    notify();
}

export function returnLoan(id) {
    loans = loans.filter((loan) => loan.id !== id);
    notify();
}

export function getLoans() {
    return loans;
}

export function subscribe(callback) {
    listeners.push(callback);
    return () => {
        listeners = listeners.filter((listener) => listener !== callback);
    };
}

function notify() {
    listeners.forEach((callback) => callback(loans));
}