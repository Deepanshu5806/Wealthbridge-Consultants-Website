// ===== NAVBAR SCROLL EFFECT =====
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ===== MOBILE MENU =====
const mobileToggle = document.querySelector('.mobile-toggle');
const navLinks = document.querySelector('.nav-links');
if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        mobileToggle.classList.toggle('active');
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            mobileToggle.classList.remove('active');
        });
    });
}

// ===== SCROLL REVEAL ANIMATIONS =====
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.05, rootMargin: '0px 0px 60px 0px' });

revealElements.forEach(el => revealObserver.observe(el));

// Immediately reveal any elements already in viewport on load
function revealInViewport() {
    revealElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 80) {
            el.classList.add('visible');
            revealObserver.unobserve(el);
        }
    });
}
// Run after page loader dismisses
setTimeout(revealInViewport, 500);

// ===== COUNTER ANIMATION =====
const counters = document.querySelectorAll('.count-up');
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-target'));
            const suffix = el.getAttribute('data-suffix') || '';
            const prefix = el.getAttribute('data-prefix') || '';
            const duration = 2000;
            const startTime = performance.now();

            function updateCounter(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(eased * target);
                el.textContent = prefix + current.toLocaleString() + suffix;
                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    el.textContent = prefix + target.toLocaleString() + suffix;
                }
            }
            requestAnimationFrame(updateCounter);
            counterObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

counters.forEach(el => counterObserver.observe(el));

// ===== PARTICLES =====
function createParticles() {
    const container = document.querySelector('.particles');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (4 + Math.random() * 4) + 's';
        particle.style.width = (2 + Math.random() * 3) + 'px';
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}
createParticles();

// ===== UNLISTED SHARES DATA (Source: sharescart.com / Stocx) =====
const unlistedData = {
    nse: {
        name: "National Stock Exchange (NSE)",
        sector: "Financial Infrastructure",
        color: "#1a56db",
        logo: "NSE",
        about: "The National Stock Exchange of India Limited is the leading stock exchange in India and the fourth largest in the world by equity trading volume. NSE was the first exchange in India to provide modern, fully automated screen-based electronic trading. It pioneered the dematerialized trading system and has been instrumental in transforming the Indian capital markets landscape.",
        metrics: {
            "Share Price (Approx.)": "~₹2,025",
            "Face Value": "₹1",
            "Market Cap (Est.)": "~₹5,01,188 Cr",
            "P/E Ratio": "~208.1x",
            "Revenue (FY24)": "~₹14,780 Cr",
            "Net Profit (FY24)": "~₹8,306 Cr",
            "Promoter Holding": "~20%",
            "EPS": "~₹9.74",
            "Dividend Yield": "~3.2%",
            "Book Value": "~₹580",
            "ROE": "~28%",
            "Debt-to-Equity": "0"
        },
        keyMetrics: {
            price: "~₹2,025",
            pe: "~208.1x",
            mcap: "~₹5.01L Cr"
        }
    },
    sbiamc: {
        name: "SBI AMC (SBI Mutual Fund)",
        sector: "Asset Management",
        color: "#2563eb",
        logo: "SBI AMC",
        about: "SBI Funds Management Limited is a joint venture between State Bank of India and Amundi (France). It is India's largest asset management company by AUM, managing over ₹10 lakh crore in assets. SBI Mutual Fund offers a comprehensive range of investment products across equity, debt, hybrid, and ETF categories, serving millions of retail and institutional investors.",
        metrics: {
            "Share Price (Approx.)": "~₹775",
            "Face Value": "₹10",
            "Market Cap (Est.)": "~₹1,57,437 Cr",
            "AUM": "~₹10.5 Lakh Cr",
            "P/E Ratio": "~62x",
            "Revenue (FY24)": "~₹4,500 Cr",
            "Net Profit (FY24)": "~₹1,820 Cr",
            "Promoter Holding": "~63%",
            "EPS": "~₹12.5",
            "Dividend Yield": "~2.1%",
            "Book Value": "~₹450",
            "ROE": "~32%"
        },
        keyMetrics: {
            price: "~₹775",
            pe: "~62x",
            mcap: "~₹1.57L Cr"
        }
    },
    zepto: {
        name: "Zepto",
        sector: "Quick Commerce / Technology",
        color: "#7c3aed",
        logo: "Z",
        about: "Zepto is India's fastest-growing quick commerce platform, delivering groceries and essentials in 10 minutes. Founded in 2021 by Stanford dropouts Aadit Palicha and Kaivalya Vohra, Zepto has rapidly scaled to operate over 500+ dark stores across major Indian cities. The company has raised significant funding and is valued among the top Indian unicorns, with aggressive plans for profitability and expansion.",
        metrics: {
            "Share Price (Approx.)": "~₹42",
            "Face Value": "₹1",
            "Market Cap (Est.)": "~₹74,194 Cr",
            "P/E Ratio": "-59.4x",
            "Revenue (FY24)": "~₹4,454 Cr",
            "Net Loss (FY24)": "~₹-1,248 Cr",
            "EPS": "~₹-0.71",
            "Book Value": "~₹0.4",
            "Total Funding": "~$1.4 Billion",
            "Dark Stores": "500+",
            "Key Investors": "StepStone, Y Combinator",
            "Founded": "2021"
        },
        keyMetrics: {
            price: "~₹42",
            pe: "-59.4x",
            mcap: "~₹74,194 Cr"
        }
    },
    msei: {
        name: "Metropolitan Stock Exchange (MSEI)",
        sector: "Financial Infrastructure",
        color: "#0891b2",
        logo: "MSEI",
        about: "Metropolitan Stock Exchange of India Limited (MSEI), formerly known as MCX Stock Exchange, is a stock exchange in India. It received recognition from SEBI and commenced operations in 2012. MSEI offers trading in equity, equity derivatives, currency derivatives, and debt market segments. The exchange is positioned as a technology-driven marketplace with competitive transaction costs.",
        metrics: {
            "Share Price (Approx.)": "~₹6.25",
            "Face Value": "₹1",
            "Market Cap (Est.)": "~₹6,875 Cr",
            "P/E Ratio": "-200.9x",
            "Revenue (FY24)": "~₹45 Cr",
            "Net Loss (FY24)": "~₹-32 Cr",
            "EPS": "~₹-0.03",
            "Book Value": "~₹0.4",
            "Key Shareholders": "SBI, BOB, IL&FS",
            "Segments": "Equity, FX, Debt",
            "SEBI Recognized": "Yes",
            "Promoter Holding": "~15%"
        },
        keyMetrics: {
            price: "~₹6.25",
            pe: "-200.9x",
            mcap: "~₹6,875 Cr"
        }
    },
    csk: {
        name: "Chennai Super Kings (CSK)",
        sector: "Sports & Entertainment",
        color: "#eab308",
        logo: "CSK",
        about: "Chennai Super Kings Cricket Limited is the company behind one of the most successful and iconic franchises in the Indian Premier League (IPL). Led by MS Dhoni, CSK has won 5 IPL titles and has one of the most loyal fanbases in world cricket. The franchise is majority owned by India Cements and Chennai Super Kings Cricket Ltd (CSKCL), led by N. Srinivasan. CSK consistently generates strong revenues from broadcasting rights, sponsorships, and merchandise.",
        metrics: {
            "Share Price (Approx.)": "~₹268",
            "Face Value": "₹10",
            "Market Cap (Est.)": "~₹10,169 Cr",
            "P/E Ratio": "~68.6x",
            "Revenue (FY24)": "~₹490 Cr",
            "Net Profit (FY24)": "~₹115 Cr",
            "EPS": "~₹3.91",
            "Book Value": "~₹18.8",
            "IPL Titles": "5",
            "Key Owner": "India Cements Group",
            "Captain": "MS Dhoni (Mentor)",
            "Home Ground": "MA Chidambaram"
        },
        keyMetrics: {
            price: "~₹268",
            pe: "~68.6x",
            mcap: "~₹10,169 Cr"
        }
    },
    incred: {
        name: "InCred Financial Services",
        sector: "NBFC / Fintech",
        color: "#dc2626",
        logo: "InCred",
        about: "InCred Financial Services is a new-age NBFC founded by former Deutsche Bank co-CEO Bhupinder Singh. It leverages technology and data analytics to provide personal loans, education loans, SME lending, and home loans. InCred uses AI-driven underwriting models to assess creditworthiness, enabling faster and more accurate lending decisions. The company has emerged as a significant player in India's digital lending landscape.",
        metrics: {
            "Valuation (Est.)": "~₹7,500 Cr",
            "Face Value": "₹10",
            "AUM": "~₹12,000 Cr",
            "P/E Ratio": "~22x",
            "Revenue (FY24)": "~₹1,800 Cr",
            "Net Profit (FY24)": "~₹320 Cr",
            "Founder": "Bhupinder Singh",
            "NPA (Gross)": "~1.8%",
            "Key Investors": "KKR, Paragon Partners",
            "Products": "Personal, Edu, SME, Home",
            "ROE": "~18%",
            "Capital Adequacy": "~22%"
        },
        keyMetrics: {
            price: "~₹680",
            pe: "~22x",
            mcap: "~₹7,500 Cr"
        }
    }
};

// ===== MODAL LOGIC =====
function openShareModal(key) {
    const data = unlistedData[key];
    if (!data) return;

    const modal = document.getElementById('shareModal');
    if (!modal) return;

    document.getElementById('modalLogo').style.background = data.color;
    document.getElementById('modalLogo').textContent = data.logo;
    document.getElementById('modalName').textContent = data.name;
    document.getElementById('modalSector').textContent = data.sector;
    document.getElementById('modalAbout').textContent = data.about;

    const metricsGrid = document.getElementById('modalKeyMetrics');
    metricsGrid.innerHTML = `
        <div class="modal-metric">
            <div class="label">Share Price</div>
            <div class="value green">${data.keyMetrics.price}</div>
        </div>
        <div class="modal-metric">
            <div class="label">P/E Ratio</div>
            <div class="value">${data.keyMetrics.pe}</div>
        </div>
        <div class="modal-metric">
            <div class="label">Market Cap</div>
            <div class="value navy">${data.keyMetrics.mcap}</div>
        </div>
    `;

    const fundList = document.getElementById('modalFundamentals');
    fundList.innerHTML = '';
    Object.entries(data.metrics).forEach(([k, v]) => {
        fundList.innerHTML += `
            <div class="fundamental-row">
                <span class="key">${k}</span>
                <span class="val">${v}</span>
            </div>
        `;
    });

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ===== PAGE LOADER =====
window.addEventListener('load', () => {
    const loader = document.querySelector('.page-loader');
    if (loader) {
        setTimeout(() => loader.classList.add('hidden'), 400);
    }
});

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});
