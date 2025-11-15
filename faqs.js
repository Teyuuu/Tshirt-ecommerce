document.querySelectorAll(".faq-question").forEach(btn => {
    btn.addEventListener("click", () => {
        const item = btn.parentElement;

        // Close others
        document.querySelectorAll(".faq-item").forEach(faq => {
            if (faq !== item) faq.classList.remove("active");
            faq.querySelector(".faq-answer").style.maxHeight = null;
        });

        // Toggle current
        item.classList.toggle("active");
        const answer = item.querySelector(".faq-answer");

        if (item.classList.contains("active")) {
            answer.style.maxHeight = answer.scrollHeight + "px";
        } else {
            answer.style.maxHeight = null;
        }
    });
});
