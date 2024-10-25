// import React from 'react';

// export default class AdComponent extends React.Component {
//   componentDidMount () {
//     (window.adsbygoogle = window.adsbygoogle || []).push({});
//   }

// render () {
//     return (
//         <ins className='adsbygoogle'
//           style={{ display: 'block' }}
//           data-ad-client='ca-pub-2993063833837423'
//           data-ad-slot='9071445971'
//           data-ad-format='auto' />
//     );
//   }
// }

// ========================================================================================================================================

import React, { useEffect } from "react";

const AdComponent = () => {
  useEffect(() => {
    const pushAd = () => {
      try {
        if (window.adsbygoogle) {
          console.log("Pushing ad:", window.adsbygoogle);
          window.adsbygoogle.push({});
        }
      } catch (e) {
        console.error("Error initializing ad:", e);
      }
    };

    // Check if Adsense script is loaded every 300ms
    const interval = setInterval(() => {
      if (window.adsbygoogle && document.querySelectorAll('.adsbygoogle').length) {
        pushAd();
        // clear the interval once the ad is pushed so that function isn't called indefinitely
        clearInterval(interval);
      }
    }, 300);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "inline-block", width: "300px", height: "250px" }}
      data-ad-client="ca-pub-2993063833837423"
      data-ad-slot="9071445971"
    ></ins>
  );
};

export default AdComponent;

