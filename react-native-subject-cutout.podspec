Pod::Spec.new do |s|
  s.name         = 'react-native-subject-cutout'
  s.version      = '0.1.0'
  s.summary      = 'On-device foreground subject extraction for React Native.'
  s.homepage     = 'https://example.invalid/react-native-subject-cutout'
  s.license      = { :type => 'MIT' }
  s.authors      = { 'React Native Subject Cutout' => 'opensource@example.invalid' }
  s.platforms    = { :ios => '17.0' }
  s.source       = { :path => '.' }
  s.source_files = 'ios/**/*.{h,m,mm}'
  s.dependency 'React-Core'
  s.frameworks = 'Vision', 'CoreImage'
end
