require 'open3'

# コミットごとにチェックアウトせず、履歴の追加と削除を積み上げて日ごとのファイル数を出す
log, = Open3.capture2('git', 'log', '--first-parent', '--diff-merges=first-parent', '--reverse', '--date=short', '--format=C %cd',
                      '--name-status', '--no-renames', '--', '*.org')

count = 0
date = nil
ret = {}
log.each_line do |line|
  case line
  when /\AC (\S+)/ then date = Regexp.last_match(1)
  when /\AA\t/ then count += 1
  when /\AD\t/ then count -= 1
  end
  ret[date] = count if date
end

puts ret.map { |d, c| "#{d},#{c}" }
