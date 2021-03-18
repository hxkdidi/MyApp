const path = require('path')
const { sh, slack } = require('./utils')
const {
  ENVIRONMENT,
  PLATFORM,
  APP_NAME,
  APP_MODULE,
  VERSION_NAME,
  VERSION_CODE,
  FILE_SERVER,
  ARTIFACTS_DIR,
  BUGLY_DIST_URL,
  PATCH_ONLY,
} = require('./config')

if (PATCH_ONLY) {
  console.log('TODO:// 上传补丁包到文件服务器')
  process.exit(0)
}

if (PLATFORM === 'ios') {
  // -------------------------------ios-------------------------------------
  const workdir = process.env.IOS_DIR || path.resolve(__dirname, '../ios')
  if (ENVIRONMENT === 'production') {
    sh('bundle exec fastlane upload_ipa_to_testflight', undefined, workdir)
  } else {
    sh('bundle exec fastlane upload_ipa_to_bugly', undefined, workdir)
    slack(`ios-${APP_NAME}-${ENVIRONMENT} 有新的版本了，${BUGLY_DIST_URL}`)
  }
  process.exit(0)
}

// -------------------------------android-------------------------------------
const dest = `android/${APP_NAME}/${ENVIRONMENT}/${VERSION_NAME}`

// 上传 apk 基础包
const apk = path.join(ARTIFACTS_DIR, `${APP_MODULE}-${ENVIRONMENT}-arm64-v8a-release.apk`)
let filename = `${APP_NAME}-${ENVIRONMENT}-${VERSION_NAME}-${VERSION_CODE}.apk`

if (process.env.CI_COMMIT_SHORT_SHA) {
  filename = `${APP_NAME}-${ENVIRONMENT}-${VERSION_NAME}-${VERSION_CODE}-${process.env.CI_COMMIT_SHORT_SHA}.apk`
}

sh(`curl -F file=@${apk} -F filename=${filename} ${FILE_SERVER}/${dest}`)

// 发布 slack 通知
slack(`android-${APP_NAME}-${ENVIRONMENT} 有新的版本了，${FILE_SERVER}/${dest}`)
