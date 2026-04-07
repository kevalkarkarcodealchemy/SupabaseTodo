import React from 'react';
import Svg, {Path} from 'react-native-svg';

const ChatIcon = ({color}: {color: string}) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 11.5C21 16.1944 17.1944 20 12.5 20C11.5222 20 10.5889 19.8333 9.72222 19.5278L3 21L4.47222 16.2778C4.16667 15.4111 4 14.4778 4 13.5C4 8.80556 7.80556 5 12.5 5C17.1944 5 21 8.80556 21 11.5Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default ChatIcon;
