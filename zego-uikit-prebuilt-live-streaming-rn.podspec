require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "zego-uikit-prebuilt-live-streaming-rn"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://zegocloud.com.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,c,m,mm,swift}"
  s.requires_arc = true

  s.dependency "React-Core"
  s.dependency 'zego-uikit-rn'
end
