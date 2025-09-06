// Mobile Navigation Handler
document.addEventListener('DOMContentLoaded', function() {
    const mobileToggle = document.getElementById('mobileViewToggle');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            openMobileView();
        });
    }
    
    function openMobileView() {
        // Create mobile view overlay
        const overlay = document.createElement('div');
        overlay.id = 'mobileViewOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
        `;
        
        // Create mobile frame
        const mobileFrame = document.createElement('div');
        mobileFrame.style.cssText = `
            width: 375px;
            height: 812px;
            background: #000;
            border-radius: 40px;
            padding: 8px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            position: relative;
            transform: scale(0.8);
            transition: transform 0.3s ease;
        `;
        
        // Create mobile screen
        const mobileScreen = document.createElement('iframe');
        mobileScreen.src = 'mobile-view/index.html';
        mobileScreen.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 32px;
            background: white;
        `;
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="bx bx-x"></i>';
        closeBtn.style.cssText = `
            position: absolute;
            top: -50px;
            right: 0;
            background: rgba(255, 255, 255, 0.9);
            border: none;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s ease;
        `;
        
        closeBtn.addEventListener('click', closeMobileView);
        closeBtn.addEventListener('mouseenter', function() {
            this.style.background = 'white';
        });
        closeBtn.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(255, 255, 255, 0.9)';
        });
        
        // Assemble mobile view
        mobileFrame.appendChild(mobileScreen);
        mobileFrame.appendChild(closeBtn);
        overlay.appendChild(mobileFrame);
        document.body.appendChild(overlay);
        
        // Animate in
        setTimeout(() => {
            mobileFrame.style.transform = 'scale(1)';
        }, 100);
        
        // Close on overlay click
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeMobileView();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', handleEscapeKey);
    }
    
    function closeMobileView() {
        const overlay = document.getElementById('mobileViewOverlay');
        if (overlay) {
            const mobileFrame = overlay.querySelector('div');
            mobileFrame.style.transform = 'scale(0.8)';
            
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
        
        document.removeEventListener('keydown', handleEscapeKey);
    }
    
    function handleEscapeKey(e) {
        if (e.key === 'Escape') {
            closeMobileView();
        }
    }
    
    // Make closeMobileView available globally for iframe
    window.closeMobileView = closeMobileView;
});
