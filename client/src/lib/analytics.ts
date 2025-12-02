// Google Analytics Integration for Lumina

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

// Initialize Google Analytics
export const initGA = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;

  if (!measurementId) {
    console.warn('Missing required Google Analytics key: VITE_GA_MEASUREMENT_ID');
    return;
  }

  // Add Google Analytics script to the head
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script1);

  // Initialize gtag
  const script2 = document.createElement('script');
  script2.textContent = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `;
  document.head.appendChild(script2);
};

// Track page views - useful for single-page applications
export const trackPageView = (url: string) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;
  
  window.gtag('config', measurementId, {
    page_path: url
  });
};

// Track events
export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Lumina-specific analytics events
export const trackUserAction = {
  // Authentication events
  login: () => trackEvent('login', 'authentication', 'user_login'),
  signup: () => trackEvent('sign_up', 'authentication', 'user_signup'),
  logout: () => trackEvent('logout', 'authentication', 'user_logout'),
  walletConnect: () => trackEvent('wallet_connect', 'web3', 'metamask_connected'),
  
  // Content events
  createPost: (type: 'text' | 'image' | 'video') => trackEvent('create_post', 'content', type),
  likePost: () => trackEvent('like', 'engagement', 'post_liked'),
  commentPost: () => trackEvent('comment', 'engagement', 'post_commented'),
  sharePost: () => trackEvent('share', 'engagement', 'post_shared'),
  
  // Social events
  followUser: () => trackEvent('follow', 'social', 'user_followed'),
  unfollowUser: () => trackEvent('unfollow', 'social', 'user_unfollowed'),
  joinGroup: () => trackEvent('join_group', 'social', 'group_joined'),
  leaveGroup: () => trackEvent('leave_group', 'social', 'group_left'),
  
  // Web3 events
  tipUser: (amount: number) => trackEvent('tip_sent', 'web3', 'axm_tip', amount),
  mintNFT: () => trackEvent('mint_nft', 'web3', 'nft_minted'),
  buyNFT: (price: number) => trackEvent('buy_nft', 'web3', 'nft_purchased', price),
  stakeTokens: (amount: number) => trackEvent('stake', 'web3', 'tokens_staked', amount),
  
  // Governance events
  createProposal: () => trackEvent('create_proposal', 'governance', 'proposal_created'),
  voteProposal: () => trackEvent('vote', 'governance', 'proposal_voted'),
  
  // Messaging events
  sendMessage: () => trackEvent('send_message', 'messaging', 'dm_sent'),
  startConversation: () => trackEvent('start_conversation', 'messaging', 'conversation_started'),
};
